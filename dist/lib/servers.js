"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cluster = require("cluster");
var messages_1 = require("./messages/messages");
var worker_1 = require("./modules/worker");
var broker_1 = require("./modules/pubsub-server/broker");
if (cluster.isMaster) {
    var workers_1;
    var msgToWorker_1;
    var launchWorker_1 = function (i) {
        var worker = workers_1[i] = cluster.fork();
        msgToWorker_1.data.id = i;
        worker.on('exit', function () {
            if (msgToWorker_1.data.restartWorkerOnFail) {
                console.log('\x1b[33m%s\x1b[0m', 'Restarting worker on fail ' + msgToWorker_1.data.id);
                launchWorker_1(i);
            }
        });
        worker.send(msgToWorker_1);
    };
    process.on('message', function (message) {
        if (message.type === 'init') {
            console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + message.data.port + ', PID ' + process.pid);
            workers_1 = new Array(message.data.workers);
            msgToWorker_1 = new messages_1.ProcessMessages('initWorker', message.data);
            cluster.fork().send(new messages_1.ProcessMessages('initBroker', message.data));
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
            require(message.data.workerPath)(server_1);
        }
        if (message.type === 'initBroker') {
            server_1 = new broker_1.Broker(message.data);
            server_1.is = 'Broker';
        }
    });
    process.on('uncaughtException', function (err) {
        if (!server_1.id)
            server_1.id = 'BR';
        console.error('\x1b[31m%s\x1b[0m', server_1.is + ' ' + server_1.id + ', PID ' + process.pid + '\n' + err + '\n');
        process.exit();
    });
}
