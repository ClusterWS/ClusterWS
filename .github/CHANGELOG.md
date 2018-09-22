# Version 4.0.0

### Types

* Remove `TlsOptions` type from now on use `SecureContextOptions` from node `tls` types (default Node.js)
* Remove `CustomObject` type instead implement specific types for everything (really was making live easier but we want a good type system)


### uWebsocket 
* Now on `onVerifyClient` returns info with full `headers` instead of just `origin` part (custom change in uWebsocket)

