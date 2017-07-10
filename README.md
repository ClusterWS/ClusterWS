# ClusterWS (Node Cluster WebSocket)
*"I was inspired by [SocketCluster](https://github.com/SocketCluster/socketcluster) to create this framework"*

[![npm version](https://badge.fury.io/js/clusterws.svg)](https://badge.fury.io/js/clusterws)

This is a **Beta Version** that is why framework may lack some important features :) . You can see main changes in [HERE](./information/CHANGELOG.md).

ClusterWS - minimalistic node js http and real-time framework which allows easily scale WebSocket([uWS](https://github.com/uNetworking/uWebSockets)- one of the fastest WebSocket libraries) between node clusters and utilize all available CPU.

ClusterWS has been written in TypeScript and compiling down to es5. All development code you can find in `src/` folder and compiled code in `dist/` folder.

### ClusterWS client libraries:

1. [JavaScript](https://github.com/goriunov/ClusterWS-Client-JS)
2. Swift IOS(coming after all main features will be implemented)
3. Java Android(coming after all main features will be implemented)

### Installation:

Use npm :

```js
npm install --save clusterws
```

### Configuration

To be able to run this framework you have to create 2 files. First one is `'server.js'` (you can name it as you wish) with:

```js
var ClusterWS = require('clusterws').ClusterWS;

var cws = new ClusterWS({ workerPath: __dirname + '/worker.js' });
```

It is mandatory to provide path to the worker

All possible options:

```js
{
    workerPath: path to the worker file (!mandatory to provide),

    workers: number of the workers default is 1,

    port: port on which main process will listen default is 3000,

    restartWorkerOnFail: if you need to restart workers on faults default is false,

    brokerPort: port on which broker will communicate (change it only if default port is busy) default is 9346,

    pingPongInterval: time between which will be send ping to the client in ms default is 20000 (20s)
}
```

Second file is `'worker.js'` (also may name as you wish but do not forget to change workerPath) all server log should be here with:

For http handler i am going to use `'express'`. So you need to run `npm install --save express`

```js
var express = require('express');

// You have to export function from this file
module.exports = function(worker){
    var httpServer = worker.httpServer;
    var webSocketServer = worker.webSocketServer;

    // http handler
    var app = express();

    // here you can write everything as usually with express ex: app.use('/' and what you need);

    httpServer.on('request',  app)

    webSocketServer.on('connect', function(socket){
        // Here write all logic for socket
    });
}
```

### Listen on events from the connected client:

To listen on event use `'on'` method which is provided by socket:

```js
socket.on('any event name', function(data){
       console.log(data);
});
```

You can listen on any event which you emit from the client also you can listen on **Reserved event** which are emitting automatically :)

Data which you get in `function(data)` it what you send with event, you can send any type of data.

**Reserved events**: `'connect'`, `'error'`, `'disconnect'`.

### Emit an event to the client:

To emit and event to the client you should use `send` method which provided by socket:

```js
socket.send('event name', data);
```

`data` can be any type you want.

**Never emit reserved events**: `'connect'`, `'error'`, `'disconnect'`.

### Pub/Sub communication:

To publish some data to the channel you can use `publish` method which is provided by webSocketServer:

```js
webSocketServer.publish('channel name', data);
```

`data` can be any type you want.

Still a lot of things to do.

## Happy codding !!! :sunglasses:



