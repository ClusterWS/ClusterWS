"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require("uws");
var tcp_socket_1 = require("./pubsub-server/tcp-socket");
var http_1 = require("http");
var eventemitter3_1 = require("eventemitter3");
var socket_1 = require("./socket/socket");
var messages_1 = require("./messages/messages");
var Worker = (function () {
    function Worker(options) {
        var _this = this;
        this.options = options;
        this.id = this.options.id;
        this.eventEmitter = new eventemitter3_1.EventEmitter();
        this.connectBroker();
        this.httpServer = http_1.createServer().listen(this.options.port, function () {
            console.log('\x1b[36m%s\x1b[0m', '          Worker: ' + _this.options.id + ', PID ' + process.pid);
        });
        var webSocketServer = new WebSocket.Server({ server: this.httpServer });
        webSocketServer.on('connection', function (_socket) {
            var socket = new socket_1.Socket(_socket, _this);
            _this.emit('connect', socket);
        });
        this.webSocketServer = webSocketServer;
        this.webSocketServer.on = function (event, fn, context) {
            _this.on(event, fn, context);
        };
        this.webSocketServer.publish = function (channel, data) {
            _this.broker.send(messages_1.MessageFactory.brokerMessage(channel, data));
        };
    }
    Worker.prototype._unsubscribe = function (event, fn, context) {
        this.eventEmitter.removeListener(event, fn, context);
    };
    Worker.prototype.on = function (event, fn, context) {
        this.eventEmitter.on(event, fn, context);
    };
    Worker.prototype.emit = function (event, data) {
        this.eventEmitter.emit(event, data);
    };
    Worker.prototype.connectBroker = function () {
        var _this = this;
        this.broker = new tcp_socket_1.TcpSocket(this.options.brokerPort, '127.0.0.1');
        this.broker.on('message', function (msg) {
            console.log(msg);
            if (msg === '_0')
                return _this.broker.send('_1');
            _this.emit('publish', JSON.parse(msg));
        });
        this.broker.on('disconnect', function () {
            console.log('Broker disconnected');
        });
    };
    return Worker;
}());
exports.Worker = Worker;
