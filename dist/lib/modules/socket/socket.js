"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = require("../../messages/messages");
var Socket = (function () {
    function Socket(_socket, server) {
        var _this = this;
        this._socket = _socket;
        this.server = server;
        this.events = {};
        this.channels = {};
        this.publishListener = function (msg) {
            var exFn = _this.channels[msg.channel];
            if (exFn)
                exFn(msg.data);
        };
        server.on('publish', this.publishListener);
        _socket.on('message', function (msg) {
            msg = JSON.parse(msg);
            if (msg.action === 'emit') {
                var fn = _this.events[msg.event];
                if (fn)
                    fn(msg.data);
            }
            if (msg.action === 'publish') {
                if (_this.channels[msg.channel])
                    server.webSocketServer.publish(msg.channel, msg.data);
            }
            if (msg.action === 'sys') {
                if (msg.event === 'subscribe') {
                    _this.channels[msg.data] = function (data) {
                        _this.send(msg.data, data, 'publish');
                    };
                }
                if (msg.event === 'unsubscribe') {
                    if (_this.channels[msg.data]) {
                        _this.channels[msg.data] = null;
                        delete _this.channels[msg.data];
                    }
                }
            }
        });
        _socket.on('close', function (code, msg) {
            var fn = _this.events['disconnect'];
            if (fn)
                fn(code, msg);
            _this.server._unsubscribe('publish', _this.publishListener);
            for (var key in _this.channels) {
                if (_this.channels.hasOwnProperty(key)) {
                    _this.channels[key] = null;
                    delete _this.channels[key];
                }
            }
            for (var key in _this.events) {
                if (_this.events.hasOwnProperty(key)) {
                    _this.events[key] = null;
                    delete _this.events[key];
                }
            }
            for (var key in _this) {
                if (_this.hasOwnProperty(key)) {
                    _this[key] = null;
                    delete _this[key];
                }
            }
        });
        _socket.on('error', function (err) {
            var fn = _this.events['error'];
            if (fn)
                fn(err);
        });
    }
    Socket.prototype.on = function (event, fn) {
        if (this.events[event])
            this.events[event] = null;
        this.events[event] = fn;
    };
    Socket.prototype.send = function (event, data, type) {
        if (type === 'publish')
            return this._socket.send(messages_1.MessageFactory.publishMessage(event, data));
        return this._socket.send(messages_1.MessageFactory.emitMessage(event, data));
    };
    return Socket;
}());
exports.Socket = Socket;
