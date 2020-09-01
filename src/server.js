const http = require('http');
const WebSocket = require('ws');
const JsonRPC = require('simple-jsonrpc-js');
const XPlaneLegacyClient = require('./XPlaneLegacyClient.js');

function noop() {}

function heartbeat() {
  this.isAlive = true;
  // console.log('heartbeat');
}

const xPlane = new XPlaneLegacyClient({ debug: true });

const server = http.createServer();

const wss1 = new WebSocket.Server({ noServer: true });
// const wss2 = new WebSocket.Server({ noServer: true });

wss1.on('connection', (ws) => {
  const client = ws;

  // @ts-ignore
  client.isAlive = true;

  client.on('pong', heartbeat);

  // @ts-ignore
  client.jrpc = new JsonRPC();

  // @ts-ignore
  client.jrpc.toStream = function toStream(message) {
    client.send(message);
  };

  client.on('message', function onMessage(message) {
    // console.log(`Raw message: ${message}`);
    // @ts-ignore
    client.jrpc.messageHandler(message);
  });

  // For less overhead (JsonRPC encoding/decoding) we could
  // implement a more direct approach such as this:
  // ws.on('message', function incoming(message) {
  //   console.log('received:', message);
  //   // @ts-ignore
  //   let match = message.match(/^CMND\s([^\s]+)$/);

  //   if (match && match.length > 1 && match[1]) {
  //     xPlane.sendCommand(match[1]);
  //     return;
  //   }

  //   // @ts-ignore
  //   match = message.match(/^RREF\s([^\s]+)(\s[0-9])?$/);

  //   if (match && match.length >= 2 && match[1]) {
  //     const dataRef = match[1];
  //     const timesPerSecond = match[2] || 1;
  //     xPlane.requestDataRef(dataRef, timesPerSecond, function gotDataRef(
  //       dRef,
  //       fltValue,
  //     ) {
  //       console.log(`in callback ${dRef} ${fltValue}`);
  //       ws.send(`Got ${dRef} ${fltValue}`);
  //     });
  //     return;
  //   }

  //   // @ts-ignore
  //   match = message.match(/^DREF\s([^\s]+)\s([0-9]+([.][0-9]+)?)$/);

  //   if (match && match.length >= 3 && match[1] && match[2]) {
  //     const dataRef = match[1];
  //     const value = match[2];
  //     xPlane.setDataRef(dataRef, value);
  //     return;
  //   }

  //   console.log(`no match on input '${message}', match:`, match);
  // });

  // @ts-ignore
  client.jrpc.on('sendCommand', ['commandRef'], function onSendCommand(
    commandRef,
  ) {
    console.log(`Got sendCommand ${commandRef}`);
    xPlane.sendCommand(commandRef);
  });

  // @ts-ignore
  client.jrpc.on('setDataRef', ['dataRef', 'value'], function onSetDataRef(
    dataRef,
    value,
  ) {
    console.log(`Got setDataRef ${dataRef} ${value}`);
    xPlane.setDataRef(dataRef, value);
  });

  // @ts-ignore
  client.jrpc.on(
    'requestDataRef',
    ['dataRef', 'timesPerSecond'],
    function onRequestDataRef(dataRef, timesPerSecond) {
      console.log(`Got requestDataRef ${dataRef} ${timesPerSecond}`);
      xPlane.requestDataRef(
        dataRef,
        timesPerSecond,
        (updatedDataRef, updatedValue) => {
          console.log(
            `the dataref ${updatedDataRef} has value ${updatedValue}`,
          );
          // @ts-ignore
          client.jrpc.call('dataRefUpdate', [updatedDataRef, updatedValue]);
        },
      );
    },
  );
});

server.on('upgrade', function upgrade(request, socket, head) {
  // eslint-disable-next-line node/no-deprecated-api
  // const newLocal = url.parse;
  // const { pathname } = newLocal(request.url);

  // if (pathname === '/legacy/v0') {
  wss1.handleUpgrade(request, socket, head, function done(ws) {
    wss1.emit('connection', ws, request);
  });
  // } else {
  //  socket.destroy();
  // }
});

const interval = setInterval(function ping() {
  wss1.clients.forEach(function each(ws) {
    // @ts-ignore
    if (ws.isAlive === false) {
      return ws.terminate();
    }

    // eslint-disable-next-line no-param-reassign
    // @ts-ignore
    ws.isAlive = false;
    return ws.ping(noop);
  });
}, 10000);

wss1.on('close', function close() {
  clearInterval(interval);
});

server.listen(8080);

// xPlane.requestDataRef('sim/cockpit2/controls/flap_ratio', 1);
// xPlane.requestDataRef('sim/time/gpu_time_per_frame_sec_approx', 1);
