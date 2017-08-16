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

### Setting up server

Create file `'server.js'` and follow next: 

![](https://u.cubeupload.com/goriunovd/e26conf.gif)

**Code:**

```js
var ClusterWS = require('clusterws').ClusterWS

var clusterWS = new ClusterWS({
    worker: Worker
})

function Worker() {}
```

*ClusterWS available options:*

```js
{
    worker: '{function} must be provided!',
    workers: '{number} how many workers will be spawned (default 1)',
    port: '{number} port on which main process will listen  (default 80)',
    restartOnFail: '{bool} function still in work (dafault false)',
    brokerPort: '{number} better to do not change, only in case if port already in use (default 9346)',
    pingInterval: '{number}  (default 20000ms)'
}
```

### Connecting socket server

![](https://u.cubeupload.com/goriunovd/sserver.gif)


**Code:**

Insert it in `'Worker'` function

```js
var socketServer = this.socketServer

socketServer.on('connection', function(socket){});
```

### Connecting http server (express)

Before connect express to the ClusterWS you have to install it with: 

```js
npm install --save express
```

![](https://u.cubeupload.com/goriunovd/httpexpress.gif)

**Code:**

Make import at the top of the file:

```js
var express = require('express')
```

then in the `'Worker'` function add

```js
var httpServer = this.httpServer
var app = express()

// any usuall express code 

this.httpServer.on('request', app)

```

### Run server

To run our server just type 

```js
node server.js
```

Congratulations you have set up basic server


## Socket


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



