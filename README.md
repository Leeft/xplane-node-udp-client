# Node module to talk to X-Plane

Module to connect to XPlane over UDP ("legacy connection") as documented
in `Instructions\X-Plane SPECS from Austin\Exchanging Data with X-Plane.rtfd\TXT.rtf` (found in your X-Plane 11 installation).

Does not (yet) support all the functionality of this interface.

Supported right now:

- CMND (send a command to X-Plane)
- RREF (request a subscription to the value of a dataref)
- DREF (change the value of a dataref)

Some code is also in place to support RPOS, however I don't need that at the moment so it's not currently enabled or handled (I played with it and decoding that data worked). Uncomment and add proper support if you need that functionality working.

Note that the documentation isn't very clear on whether big/little endian matters in all of these calls; where I was able to confirm byte order and it's documented that byte order changes I've implemented it so it's currently working on x64. I would _presume_ documentation is lacking on this front and everything is byte-order sensitive, however is there even any big endian platform that X-Plane runs on?

# Usage

```
npm install --save-dev https://github.com/Leeft/xplane-node-udp-client
```

Then import the `XPlaneLegacyClient` module into your code and use it.

See https://github.com/Leeft/xplane-websocket-proxy for code that uses this module.

# Notes

No documentation beyond this readme, no tests (yet).

This module will _not_ work in a web browser, as these do not support UDP connections. It is for standalone node applications.
