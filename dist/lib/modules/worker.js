"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var WebSocket = require("uws");
var socket_1 = require("./socket/socket");
var tcp_socket_1 = require("./pubsub-server/tcp-socket");
var eventEmitter_1 = require("./eventEmitter/eventEmitter");
var messages_1 = require("./messages/messages");
var Worker = (function () {
    function Worker(options) {
        this.options = options;
        this.id = this.options.id;
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        this._connectBroker();
        this._connectHttpServer();
        this._connectWebSocketServer();
    }
    Worker.prototype.on = function (event, fn) {
        this.eventEmitter.on(event, fn);
    };
    Worker.prototype.emit = function (event, data) {
        this.eventEmitter.emit(event, data);
    };
    Worker.prototype._unsubscribe = function (event, fn) {
        this.eventEmitter.removeListener(event, fn);
    };
    Worker.prototype._connectBroker = function () {
        var _this = this;
        this.broker = new tcp_socket_1.TcpSocket(this.options.brokerPort, '127.0.0.1');
        this.broker.on('message', function (msg) {
            if (msg === '_0')
                return _this.broker.send('_1');
            _this.emit('publish', JSON.parse(msg));
        });
        this.broker.on('disconnect', function () {
            console.log('Broker disconnected');
        });
        this.broker.on('error', function (err) {
            process.send(messages_1.MessageFactory.processMessages('error', messages_1.MessageFactory.processErrors(err.toString(), 'Worker', process.pid)));
        });
    };
    Worker.prototype._connectHttpServer = function () {
        var _this = this;
        this.httpServer = http.createServer();
        this.httpServer.listen(this.options.port, function () {
            console.log('\x1b[36m%s\x1b[0m', '          Worker: ' + _this.options.id + ', PID ' + process.pid);
        });
    };
    Worker.prototype._connectWebSocketServer = function () {
        var _this = this;
        var webSocketServer = new WebSocket.Server({ server: this.httpServer });
        webSocketServer.on('connection', function (_socket) {
            var socket = new socket_1.Socket(_socket, _this);
            _this.emit('connect', socket);
        });
        this.webSocketServer = webSocketServer;
        this.webSocketServer.on = function (event, fn) {
            _this.on(event, fn);
        };
        this.webSocketServer.publish = function (channel, data, emitPublish) {
            _this.broker.send(messages_1.MessageFactory.brokerMessage(channel, data));
            if (!emitPublish && emitPublish !== false) {
                _this.emit('publish', { channel: channel, data: data });
            }
        };
    };
    return Worker;
}());
exports.Worker = Worker;
