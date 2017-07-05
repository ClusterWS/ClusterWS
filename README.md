# ClusterWS (Node Cluster WebSocket)

This library was inspired by [SocketCluster](https://github.com/SocketCluster/socketcluster) please have a look at that if you need more functionality then
this library provides (or you can leave feather request).

ClusterWS - minimalistic node js library which allows easily scale WebSocket([uWS](https://github.com/uNetworking/uWebSockets)- on of the fastest WebSocket libraries) between node clusters and utilize all available CPU

ClusterWS is developing in TypeScript and compiling down to es5 modules which are going to be published in npm.

One of the main feathers of ClusterWS is light PubSub system. Everyone who subscribed to particular channel will get message which was published to
this channel. Every socket, client, user can subscribe to channels.

### Important to notice this library is under development and not ready for use yet. The library will be publish to NPM when ClusterWS JavaScript client will be completed.

[JavaScript Client](https://github.com/goriunov/ClusterWS-Client-JS)

After ClusterWS Javascript client  we are going to develop proper IOS (Swift) and Android (Java) libraries.



