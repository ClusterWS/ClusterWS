# ClusterWS (Node Cluster WebSocket)

[![npm version](https://badge.fury.io/js/clusterws.svg)](https://badge.fury.io/js/clusterws)

ClusterWS - is a minimal node js http and real-time framework which allows easily scale WebSocket([uWS](https://github.com/uNetworking/uWebSockets)- one of the fastest WebSocket libraries) between node js clusters and utilize all available CPU on your computer.

![](https://u.cubeupload.com/goriunovd/main.gif)

You can see main changes in [HERE](./information/CHANGELOG.md).

ClusterWS has been written in TypeScript and compiling down to es5 modules. All development code you can find in `src/` folder and compiled code in `dist/index.js` file.

### ClusterWS client libraries:

1. [JavaScript](https://github.com/goriunov/ClusterWS-Client-JS)
2. Swift IOS (coming soon)
3. Java Android (coming soon)

### Installation:

ClusterWS supports npm installation: 

```js
npm install --save clusterws
```

### Basic Set Up 

Create file `'server.js'` and follow next: 

![](https://u.cubeupload.com/goriunovd/conf.gif)

Code:

```js
var ClusterWS = require('clusterws').ClusterWS

var clusterWS = new ClusterWS({
    worker: Worker
})

function Worker() {}
```

It is mandatory to provide worker function

All possible options:

```js
{
    pathToWorker: 'path to the worker file {__dirname + string} (!mandatory to provide)',

    workers: 'number of the workers {number} default is 1',

    port: 'port on which main process will listen {number} default is 8000',

    restartWorkerOnFail: 'if you need to restart workers on error {bool} default is false',

    brokerPort: 'port on which broker will communicate (change it only if default port is busy) {number} default is 9346',

    pingInterval: 'time between which will be send ping to the client in ms {number} default is 20000 (20s)'
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

    webSocketServer.on('connection', function(socket){
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

**Reserved events**: `'connection'`, `'error'`, `'disconnect'`.

### Emit an event to the client:

To emit and event to the client you should use `send` method which provided by socket:

```js
socket.send('event name', data);
```

`data` can be any type you want.

**Never emit reserved events**: `'connection'`, `'error'`, `'disconnect'`.

### Pub/Sub communication:

To publish some data to the channel you can use `publish` method which is provided by webSocketServer:

```js
webSocketServer.publish('channel name', data);
```

`data` can be any type you want.

## Happy codding !!! :sunglasses:



