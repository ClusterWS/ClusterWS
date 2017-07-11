"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cluster = require("cluster");
var messages_1 = require("./modules/messages/messages");
var worker_1 = require("./modules/worker");
var broker_1 = require("./modules/pubsub-server/broker");
if (cluster.isMaster) {
    var broker_2;
    var workers_1;
    var initWorkerMsg_1;
    var handleChildMessages_1 = function (server) {
        server.on('message', function (message) {
            if (message.type === 'error') {
                console.error('\x1b[31m%s\x1b[0m', message.data.is + ' ' + ', PID ' + message.data.pid + '\n' + message.data.err + '\n');
            }
        });
    };
    var launchWorker_1 = function (i) {
        var worker = workers_1[i] = cluster.fork();
        initWorkerMsg_1.data.id = i;
        worker.on('exit', function () {
            if (initWorkerMsg_1.data.restartWorkerOnFail) {
                console.log('\x1b[33m%s\x1b[0m', 'Restarting worker on fail ' + initWorkerMsg_1.data.id);
                launchWorker_1(i);
            }
        });
        handleChildMessages_1(worker);
        worker.send(initWorkerMsg_1);
    };
    process.on('message', function (message) {
        if (message.type === 'init') {
            console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + message.data.port + ', PID ' + process.pid);
            workers_1 = new Array(message.data.workers);
            initWorkerMsg_1 = messages_1.MessageFactory.processMessages('initWorker', message.data);
            broker_2 = cluster.fork();
            handleChildMessages_1(broker_2);
            broker_2.send(messages_1.MessageFactory.processMessages('initBroker', message.data));
            for (var i = 0; i < message.data.workers; i++) {
                launchWorker_1(i);
            }
        }
    });
}
else {
    var server_1;
    process.on('message', function (message) {
        if (message.type === 'initWorker') {
            server_1 = new worker_1.Worker(message.data);
            server_1.is = 'Worker';
            require(message.data.pathToWorker)(server_1);
        }
        if (message.type === 'initBroker') {
            server_1 = new broker_1.Broker(message.data);
            server_1.is = 'Broker';
        }
    });
    process.on('uncaughtException', function (err) {
        process.send(messages_1.MessageFactory.processMessages('error', messages_1.MessageFactory.processErrors(err.toString(), server_1.is, process.pid)));
        process.exit();
    });
}
