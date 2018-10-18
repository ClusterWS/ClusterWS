# ClusterWS Internal Docs (will be moved to website eventually)

*Under work*

### Protocol
ClusterWS is based on websocket Protocol but it also uses internal protocol to communicate between client and server.

Details:
Message is a string or binary (as websocket can send only these types) build from array 

```
type: string can be (e (emit), p(publish), i(internal))
event: string (for e(emit) it is event name, for p(it is channel name))
data: any (data which user sends)

[type, event, data]
```

