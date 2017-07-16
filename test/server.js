var ClusterWS = require('../dist/index').ClusterWS;
var express = require('express');
var path = require('path');

var cws = new ClusterWS({
    workers: 2,
    port: 3000,
    restartWorkerOnFail: false,
    pingPongInterval: 5000
});


module.exports.Worker = function (worker) {
    var httpServer = worker.httpServer;
    var webSocketServer = worker.webSocketServer;

    var app = express();
    app.use('/', express.static(path.join(__dirname + '/public')));

    httpServer.on('request', app);

    webSocketServer.on('connect', function (socket) {

        socket.on('disconnect', function (code, reason) {
        });

        socket.send('hello', 'I am in the right place');
    });
}