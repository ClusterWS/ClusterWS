"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var JsonSocket = require("json-socket");
var Broker = (function () {
    function Broker(options) {
        var _this = this;
        this.options = options;
        this.servers = [];
        this.brokerServer = net.createServer();
        this.brokerServer.listen(this.options.brokerPort);
        console.log('\x1b[36m%s\x1b[0m', '>>> Broker on: ' + this.options.brokerPort + ', PID ' + process.pid);
        this.brokerServer.on('connection', function (socket) {
            socket = new JsonSocket(socket);
            var length = _this.servers.length;
            socket.id = length;
            socket.pingInterval = setInterval(function () {
                socket.sendMessage('_0');
            }, 20000);
            _this.servers[length] = socket;
            socket.on('message', function (msg) {
                if (msg === '_1')
                    return;
                _this.broadcast(socket.id, msg);
            });
            socket.on('close', function () {
                clearInterval(_this.servers[socket.id].pingInterval);
                _this.servers[socket.id] = null;
                _this.servers.splice(socket.id, 1);
            });
        });
    }
    Broker.prototype.broadcast = function (id, msg) {
        for (var i = 0, len = this.servers.length; i < len; i++) {
            if (id !== i) {
                this.servers[i].sendMessage(msg);
            }
        }
    };
    return Broker;
}());
exports.Broker = Broker;
