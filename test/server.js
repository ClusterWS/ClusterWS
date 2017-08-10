var path = require('path');
// var express = require('express');
// var ClusterWS = require('../dist/index').ClusterWS;
var ClusterWS = require('../dist/index').ClusterWS;

new ClusterWS({
    worker: Worker,
    workers: 2,
    restartWorkerOnFail: false
})


function Worker (){

}

// var cws = new ClusterWS({
//     worker: Worker,
//     workers: 2,
//     restartWorkerOnFail: false
// });


// function Worker() {
//     var app = express();
//     app.use('/', express.static(path.join(__dirname + '/public')));

//     this.httpServer.on('request', app);
//     this.webSocketServer.on('connection', function (socket) {

//         socket.on('disconnect', function (code, reason) {

//         });
//         socket.send('hello', 'I am in the right place');
//     });
// }