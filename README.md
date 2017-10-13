# ClusterWS "Node JS Cluster & WebSocket"
[![npm version](https://badge.fury.io/js/clusterws.svg)](https://badge.fury.io/js/clusterws)
[![GitHub version](https://badge.fury.io/gh/goriunov%2FClusterWS.svg)](https://badge.fury.io/gh/goriunov%2FClusterWS)

![](https://u.cubeupload.com/goriunovd/6cdmain.gif)

## Overview
ClusterWS - is a minimal **Node JS http & real-time** framework which allows to scale WebSocket ([uWS](https://github.com/uNetworking/uWebSockets) - one of the fastest WebSocket libraries) between **Workers** in [Node JS Cluster](https://nodejs.org/api/cluster.html) and utilize all available CPU.

*A single instance of Node JS runs in a single thread. To take advantage of multi-core systems the user will sometimes want to launch a cluster of Node JS processes (**Workers**) to handle the load. To learn more about Node JS Cluster read official Node JS docs [here](https://nodejs.org/api/cluster.html).*

### ClusterWS client libraries:
* [Java](https://github.com/ClusterWS/ClusterWS-Client-Java) 
* [Swift](https://github.com/ClusterWS/ClusterWS-Client-Swift)
* [JavaScript](https://github.com/ClusterWS/ClusterWS-Client-JS)

## Installation
To install ClusterWS run:
```js
npm install --save clusterws
```

## Setting Up
### 1. Creating server
First of all you need to create `server.js` file with: 
```js
var ClusterWS = require('clusterws').ClusterWS

var cws = new ClusterWS({
    worker: Worker
})

function Worker() { 
    var httpServer = this.httpServer
    var socketServer = this.socketServer

    // Listen on connection to the WebSocket
    socketServer.on('connection', function(socket){})
}
```

*All available options of ClusterWS:*
```js
{
    worker: '{function} will be scale between all clusters. (must be provided)',
    workers: '{number} amount of workers/clusters. (default 1)',
    port: '{number} port on which main process will listen. (default 80)',
    restartOnFail: '{bool} in development. (dafault false)',
    brokerPort: '{number} dont change if it is not needed. (default 9346)',
    pingInterval: '{number} how often ping will be send to the client. (default 20000) in ms'
}
```

### 2. Connecting http library
You can connect any http library you like *Express*, *Koa*, *etc.* With `httpServer` method:
```js
var ClusterWS = require('clusterws').ClusterWS
var express = require('express')

var cws = new ClusterWS({
    worker: Worker
})

function Worker() { 
    var httpServer = this.httpServer
    var socketServer = this.socketServer

    var app = express()
    // Express code as usualy
    httpServer.on('request', app) // for koa use app.callback()

    // Listen on connection to the WebSocket
    socketServer.on('connection', function(socket){})
}
```

**Done you have set up basic server** :sunglasses:

To start server run:
```
node server.js
```
*After that you should see blue text in the terminal*

## Handle Sockets
All code below will be written inside of 
```js
socketServer.on('connection', function(socket){
    // Here
})
```

### 1. Listen on events
To listen on events from the connected client use `on` method witch is provided by `socket`
```js
/**
    event name: string - can be any string you wish
    data: any - is what you send from the client
*/
socket.on('event name', function(data){
    // in here you can write any logic
})
```

*Also `socket` gets **Reserved Events** such as `'error'` and `'disconnect'`*

```js

/**
    err: any - display the problem with your weboscket
*/
socket.on('error', function(err){
    // in here you can write any logic
})

/**
    code: number - represent the reason in number
    reason: string - reason why your socket was disconnected
*/
socket.on('disconnect', function(code, reason){
    // in here you can write any logic
})
```

### 2. Send events
To send events from the server to the connected client use `send` method witch is provided by `socket`
```js
/**
    event name: string - can be any string you wish (client must listen on this event name)
    data: any - is what you want to send to the client
*/
socket.send('event name', data)
```

*Avoid emitting **Reserved Events** such as `'error'` and `'disconnect'`. Also avoid emitting `'connect'` event and events with `'#'` at the start.*

## Pub/Sub
To make WebSocket scalable between Workers in Node JS Cluster we need to use `Pub/Sub system`. Why? Because it is easy. ClusterWS does not have `broadcast` function, because `broadcast` is not scalable between Workers. With `ClusterWS Pub/Sub System` you can implement your own `pubsub-broadcast` very easy, also you can make different channels with different users in there or you can give each user his/her own(private) channel.

`ClusterWS Server` library does not allow to subscribe user from inside (bad practice), but you can learn about how to subscribe to the channels in `Client libraries` (shown above)

### 1. Publish message to the channel
To publish message from the server to all users who are subscribed to the channel you should use `publish` method which is provided by `socketServer`
```js
/**
    channel name: string - the name of the channel on which you wan to send data
    data: any - is what you want to send to the clients you are subscribed to the channel
*/
socketServer.publish('channel name', data)
```

### 2. Handle subscription to the channel (allow/reject)
To be able to control who is connecting to the channel you can use middleware function
```js
var ClusterWS = require('clusterws').ClusterWS
var express = require('express')

var cws = new ClusterWS({
    worker: Worker
})

function Worker() { 
    var httpServer = this.httpServer
    var socketServer = this.socketServer

    var app = express()
    // Express code as usualy
    httpServer.on('request', app) // for Koa use app.callback()

    /**
        Subscription middleware
        socket: Socket - the instanse of Socket which is trying to subscribe
        channelName: string - channel to which socket is trying to subscribe
        next: function - is using to allow or reject subsciption
    */
    socketServer.middleware.onSubscribe = function(socket, channelName, next){
        // this will allow to subscribe
        next() 
        next(false)
        // this will reject subsciption
        next('any thing except for false')
    }


    // Listen on connection to the WebSocket
    socketServer.on('connection', function(socket){})
}
```

## See Also
* [Medium ClusterWS](https://medium.com/clusterws)
* [ClusterWS Tests](https://github.com/ClusterWS/ClusterWS-Tests)
* [ClusterWS Example Chat](https://github.com/goriunov/ClusterWS-Chat-Example)

*Docs are still under development. If you have found any errors please submit pull request or leave issue*

## Happy coding !!! :sunglasses:
