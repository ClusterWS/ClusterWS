# ClusterWS (Node Cluster WebSocket)

This library was inspired by [SocketCluster](https://github.com/SocketCluster/socketcluster) please have a look at that if you need more functionality then
this library provides (or you can leave feather request).

ClusterWS - minimalistic node js library which allows easily scale WebSocket([uWS](https://github.com/uNetworking/uWebSockets)- one of the fastest WebSocket libraries) between node clusters and utilize all available CPU

ClusterWS is developing in TypeScript and compiling down to es5 modules which you can find in `dist/` folder.

### ClusterWS client libraries:

1. [JavaScript](https://github.com/goriunov/ClusterWS-Client-JS)
2. Swift (in plans)
3. Java (in plans)

### Installation:

Use npm : `npm i --save clusterws`

### Configuration

To be able to run this library you have to create 2 files. First one is `'server.js'` (name it as you wish) with:

```js
var ClusterWS = require('clusterws').ClusterWS;

var cws = new ClusterWS({ workerPath: __dirname + '/worker.js' });
```

It is mandatory to provide path to the worker


All possible options:

       {
            workerPath: path to the worker file (!mandatory to provide)

            workers: number of the workers default is 1,

            port: port on which main process will listen default is 3000,

            restartWorkerOnFail: if you need to restart workers on any faults default is false,

            brokerPort: port on which will broker (change it only if default port is busy) default is 9346
        }


Second file is `'worker.js'` (also may name as you wish but do not forget to change workerPath) with:

    Here will go all server logic!

    module.exports = function(worker){
        var httpServer = worker.httpServer;
        var webSocketServer = worker.webSocketServer;

        webSocketServer.on('connect', function(socket){
            // Here write all logic with socket
        });
    }

### Listen to events:

    socket.on('any event name', function(data){
           console.log(data);
    });

    Reserved events: `'connect'`, `'error'`, `'disconnect'`.

### Emit an event:

    socket.send('event name', data);  // Can send any type of data

    Reserved, do not emit this events: `'connect'`, `'error'`, `'disconnect'`.

### Pub/Sub:

To publish some data on channel you can use WebSocket server instance

    webSocketServer.publish('channel name', data); // Can send any type of data


Still a lot of thing to make.


## Happy codding !!! :sunglasses:



