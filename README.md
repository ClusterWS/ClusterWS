# ClusterWS (Node Cluster WebSocket)

[![npm version](https://badge.fury.io/js/clusterws.svg)](https://badge.fury.io/js/clusterws)

ClusterWS - is a minimal **Node JS http & real-time** framework which allows to scale WebSocket ([uWS](https://github.com/uNetworking/uWebSockets) - one of the fastest WebSocket libraries) between node js clusters and utilize all available CPU.

![](https://u.cubeupload.com/goriunovd/6cdmain.gif)

ClusterWS has been written in TypeScript and compiling down to es5 modules. All development code can be found in `src/` folder and compiled code in `dist/`.

[ClusterWS CHANGELOG.](./information/CHANGELOG.md)

### ClusterWS client libraries:

1. [JavaScript](https://github.com/goriunov/ClusterWS-Client-JS)
2. Swift IOS (coming soon)
3. [Java Android](https://github.com/Yegorisa/ClusterWS-Client-Java)

### Installation:

ClusterWS `npm` installation: 

```js
npm install --save clusterws
```

## Setting server

### 1. Creating server file with basic stracture

Create file `'server.js'` and follow next: 

<div style="text-align:center"><img  src ="https://u.cubeupload.com/goriunovd/server1.gif"></div>

#### **Code:**

```js
var ClusterWS = require('clusterws').ClusterWS

var clusterWS = new ClusterWS({
    worker: Worker
})

function Worker() {}
```

*ClusterWS all options:*

```js
{
    worker: '{function} must be provided!',
    workers: '{number} number of workers (default 1)',
    port: '{number} port on which main process will listen (default 80)',
    restartOnFail: '{bool} in development (dafault false)',
    brokerPort: '{number} better to do not change it, only in case if port already in use (default 9346)',
    pingInterval: '{number}  (default 20000ms)'
}
```

### 2. Connecting socket server

<div style="text-align:center"><img  src ="https://u.cubeupload.com/goriunovd/server2.gif"></div>

#### **Code:**

Insert it in `'Worker'` function

```js
var socketServer = this.socketServer

socketServer.on('connection', function(socket){})
```

### 3. Connecting http server (express)

Before connecting `express` to the ClusterWS you have to install it with: 

```js
npm install --save express
```

<div style="text-align:center"><img  src ="https://u.cubeupload.com/goriunovd/server3.gif"></div>

#### **Code:**

Make import at the top of the `'server.js'` file:

```js
var express = require('express')
```

then in the `'Worker'` function add:

```js
var httpServer = this.httpServer
var app = express()

// any usuall express code 

httpServer.on('request', app)

```

### 4. Run server

<div style="text-align:center"><img  src ="https://u.cubeupload.com/goriunovd/server4.gif"></div>

To run our server just type in `'cmd/terminal'`

```js
node server.js
```

If you see blue color text like on gif above then

#### Congratulations you have set up basic server :sunglasses:

## Socket

All code will be inside of the :

```js 
socketServer.on('connection', function(socket){
    // HERE  
});
```

### 1. Listen on events from the connected user:

To listen on events use `'on'` method which is provided by socket:

<div style="text-align:center"><img  src ="https://u.cubeupload.com/goriunovd/server5.gif"></div>

#### **Code:**

```js
socket.on('myevent', function(data){
    //write what to do if this event fires
})
```

*You can listen on any events which you emit from the clients and you can also listen on **Reserved events** which are emitted automatically by the server*

*Data which you get in `function(data){}` is what you send with events, you can send `any type of data`.*

***Reserved events**: `'connection'`, `'error'`, `'disconnect'`*

```js
socket.on('error', function(err){
    //write what to do on error
})

socket.on('disconnect', function(code, msg){
    //write what to do on disconnect
})
```

### 2. Emit an event with or without data to the user:

To emit events to the connected users you should use `'send'` method which is provided by socket:

<div style="text-align:center"><img  src ="https://u.cubeupload.com/goriunovd/server6.gif"></div>

#### **Code:**

```js
socket.send('myevent', 'any type of data')
```

*`'any type of data'` can be any type you want such as `array`, `string`, `object`, `...`*

***Try to avoid emitting reserved events**: `'connection'`, `'error'`, `'disconnect'`, or any events which start with `'#'`*

## Pub/Sub System

The publish-subscribe pattern (or pub/sub, for short) is messaging pattern where senders of messages (`publishers`), do not program the messages to be sent directly to specific receivers (`subscribers`). Instead, the programmer `publishes` messages (events), without any knowledge of any subscribers there may be. [Author](https://www.toptal.com/ruby-on-rails/the-publish-subscribe-pattern-on-rails)

`ClusterWS` contains own written `Pub/Sub system` which allows to send messages between node js workers to every user who is subscribed to the channel.

Each connected client can have as many channels as you want (I don't think that it will be more then 100 - 200 channels per client). Each client can even have their own unique channels. It all depends from how you want to design your application. Server does not allow to subscribe clients to the channels from inside of the server. Only request from the client will subscribe him to the channel, therefore all information about subscription to the channels can be found in client libraries.


To publish data from the server to the channels you can use `'publish'` method which is provided by `'socketServer'`:

<div style="text-align:center"><img  src ="https://u.cubeupload.com/goriunovd/server7.gif"></div>

#### **Code:**

```js
socketServer.publish('mychannel', 'any type of data')
```

*`'any type of data'` can be any type you want such as `array`, `string`, `object`, `...`*

### This document is under development

## Happy codding !!! :sunglasses: