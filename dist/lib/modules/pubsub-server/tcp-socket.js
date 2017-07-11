"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net_1 = require("net");
var eventEmitter_1 = require("../eventEmitter/eventEmitter");
var TcpSocket = (function () {
    function TcpSocket(port, host) {
        var _this = this;
        this.port = port;
        this.host = host;
        this.dataBuffer = '';
        this.eventEmitter = new eventEmitter_1.EventEmitter();
        if (port instanceof net_1.Socket) {
            this.socket = port;
        }
        else {
            this.socket = net_1.connect(port, host);
        }
        this.socket.on('connect', function () {
            _this.emit('connect');
        });
        this.socket.on('data', function (data) {
            var str = data.toString();
            var i = str.indexOf('\n');
            if (i === -1) {
                _this.dataBuffer += str;
                return;
            }
            _this.emit('message', _this.dataBuffer + str.slice(0, i));
            var nextPart = i + 1;
            while ((i = data.indexOf('\n', nextPart)) !== -1) {
                _this.emit('message', str.slice(nextPart, i));
                nextPart = i + 1;
            }
            _this.dataBuffer = str.slice(nextPart);
        });
        this.socket.on('end', function () {
            _this.emit('disconnect');
        });
        this.socket.on('error', function (err) {
            _this.emit('error', err);
        });
    }
    TcpSocket.prototype.send = function (data) {
        this.socket.write(data + '\n');
    };
    TcpSocket.prototype.on = function (event, fn) {
        this.eventEmitter.on(event, fn);
    };
    TcpSocket.prototype.emit = function (event, data) {
        this.eventEmitter.emit(event, data);
    };
    return TcpSocket;
}());
exports.TcpSocket = TcpSocket;
