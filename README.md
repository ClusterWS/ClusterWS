<h1 align="center">ClusterWS</h1> 
<h6 align="center">WebSocket & Node JS Cluster</h6>

![](https://u.cubeupload.com/goriunovd/ClusterWS.gif)

<p align="center">
 <a title="NPM Version" href="https://badge.fury.io/js/clusterws"><img src="https://badge.fury.io/js/clusterws.svg"></a>
 <a title="GitHub version" href="https://badge.fury.io/gh/goriunov%2FClusterWS"><img src="https://badge.fury.io/gh/goriunov%2FClusterWS.svg"></a>
</p>


**This README, logo and animation will be changed soon, we are currently implementing new GUIDES in wikis and working with new logo and animation**

## Overview
ClusterWS - is a minimal **Node JS http & real-time** framework which allows to scale WebSocket ([uWS](https://github.com/uNetworking/uWebSockets) - one of the fastest WebSocket libraries) between **Workers** in [Node JS Cluster](https://nodejs.org/api/cluster.html) and utilize all available CPU.

*We have added machine scale as well, look at the bottom of README for more information*

*A single instance of Node JS runs in a single thread. To take advantage of multi-core systems the user will sometimes want to launch a cluster of Node JS processes (**Workers**) to handle the load. To learn more about Node JS Cluster read official Node JS docs [here](https://nodejs.org/api/cluster.html).*

#### From author: 
*We would really appreciate if you give us some stars **(on all our repositories)** this will motivate us to work harder. Thank you* :blush:.

#### ClusterWS client libraries:
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
    restartWorkerOnFail: '{bool} will automatically restart broken workers. (dafault false)',
    brokerPort: '{number} dont change if it is not needed. (default 9346)',
    pingInterval: '{number} how often ping will be send to the client. (default 20000) in ms',
    useBinary: '{boolean} will send messages between server and client in binrary good to use for production. (default false) ',
    machineScale : {
        // Look at the bottom of README for more information
    }
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


## Machine-Scale
To scale websocket across different machine you will need to pass object **`machinescale`**  to ClusterWS options:
```js
var cws = new ClusterWS({
    worker: Worker,
    machineScale:{
        // Master option set it true on main server (to which all other servers will connect) you have to have only one master
        master: true || false  
        // Set port (any port) to which other servers will be connected if master set true on master you have to set the same port
        port: 5555
        // if master is false or not set you have tp pass url to your master server
        url: 'url to your master server without http:// ,https://, ws://, wss://' ex: 'localhost'
        // also for better security you can set externalKey (it has to be the same across all servers)
        externalKey: ''
    }
})
```

**if you would like to test it localy make sure you set different ports on each execution for ClusterWS and Broker**

## Performance Tips
This part is just suggestions about how to improve performance and stability of your app.

When you start your ClusterWS app, it will create one broker and workers amount which you set in options
for example you set 5 workers, so eventualy you will have 6 workers (because one of them is broker) therefore if you are not using machine scale module you better set
workers amount on one less then you have CPU on your machine.

In case if you have Machine Scaling module only on master process's app creates one more broker to handle messages to everyone, therefore only where you set `master:true` you will need to set workers on one more less then above, for example you have 5 cores on you computer you better set **only for matser:true** :  workers to 3 because 1 will be internal Broker and another one external Broker all together is 5. For servers which are not masters you have to follow standards above.

This is just my suggestions you may set workers as many as you want even if you have 1 core but it will not give you any advantages (just usless). 

## See Also
* [Medium ClusterWS](https://medium.com/clusterws)
* [ClusterWS Tests](https://github.com/ClusterWS/ClusterWS-Tests)
* [ClusterWS Example Chat](https://github.com/goriunov/ClusterWS-Chat-Example)

*Docs are still under development. If you have found any errors please submit pull request or leave issue*

## Happy coding !!! :sunglasses: