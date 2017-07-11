"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var tcp_socket_1 = require("./tcp-socket");
var Broker = (function () {
    function Broker(options) {
        var _this = this;
        this.options = options;
        this.servers = [];
        console.log('\x1b[36m%s\x1b[0m', '>>> Broker on: ' + this.options.brokerPort + ', PID ' + process.pid);
        this.brokerServer = net.createServer();
        this.brokerServer.listen(this.options.brokerPort);
        this.brokerServer.on('connection', function (socket) {
            socket = new tcp_socket_1.TcpSocket(socket);
            var length = _this.servers.length;
            socket.id = length;
            socket.pingInterval = setInterval(function () {
                socket.send('_0');
            }, 5000);
            _this.servers[length] = socket;
            socket.on('message', function (msg) {
                if (msg === '_1')
                    return;
                _this.broadcast(socket.id, msg);
            });
            socket.on('disconnect', function () {
                console.log('socket disconnected');
            });
            socket.on('error', function (err) {
                console.log(err);
            });
        });
    }
    Broker.prototype.broadcast = function (id, msg) {
        for (var i = 0, len = this.servers.length; i < len; i++) {
            if (id !== i) {
                this.servers[i].send(msg);
            }
        }
    };
    return Broker;
}());
exports.Broker = Broker;
