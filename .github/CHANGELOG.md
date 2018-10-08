# Version 4.0.0

This section specifies only braking changes from version 3.

### Types

* Remove `TlsOptions` type from now on use `SecureContextOptions` from node `tls` types (default Node.js)
* Remove `CustomObject` type instead implement specific types for everything (really was making live easier but we want a good type system)


### uWebsocket 
* Now on `onVerifyClient` returns info with full `headers` instead of just `origin` part (custom change in uWebsocket)

### New
* Middelware use new Enum(JS Object) instead of passing string.

### Other
* Encode Decode engine is not in stable (may need to be clarified)