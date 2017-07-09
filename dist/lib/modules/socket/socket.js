"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = require("../../messages/messages");
var Socket = (function () {
    function Socket(_socket, server) {
        var _this = this;
        this._socket = _socket;
        this.server = server;
        this.pingPong = 0;
        this.events = {};
        this.channels = {};
        this.send('config', { ping: this.server.options.pingPongInterval }, 'internal');
        this.pingPongInterval = setInterval(function () {
            if (_this.pingPong >= 2) {
                return _this.disconnect(1000, 'Did not get pong');
            }
            _this.send('_0', null, 'ping');
            _this.pingPong++;
        }, this.server.options.pingPongInterval);
        this.publishListener = function (msg) {
            var exFn = _this.channels[msg.channel];
            if (exFn)
                exFn(msg.data);
            return;
        };
        this.server.on('publish', this.publishListener);
        this._socket.on('message', function (msg) {
            if (msg === '_1') {
                return _this.pingPong--;
            }
            msg = JSON.parse(msg);
            if (msg.action === 'emit') {
                var fn = _this.events[msg.event];
                if (fn)
                    fn(msg.data);
                return;
            }
            if (msg.action === 'publish') {
                if (_this.channels[msg.channel])
                    _this.server.webSocketServer.publish(msg.channel, msg.data);
                return;
            }
            if (msg.action === 'internal') {
                if (msg.event === 'subscribe') {
                    _this.channels[msg.data] = function (data) {
                        _this.send(msg.data, data, 'publish');
                    };
                    return;
                }
                if (msg.event === 'unsubscribe') {
                    if (_this.channels[msg.data]) {
                        _this.channels[msg.data] = null;
                        delete _this.channels[msg.data];
                    }
                    return;
                }
            }
            return;
        });
        this._socket.on('close', function (code, msg) {
            var fn = _this.events['disconnect'];
            if (fn)
                fn(code, msg);
            clearInterval(_this.pingPongInterval);
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
            return;
        });
        this._socket.on('error', function (err) {
            var fn = _this.events['error'];
            if (fn)
                fn(err);
            return;
        });
    }
    Socket.prototype.on = function (event, fn) {
        if (this.events[event])
            this.events[event] = null;
        return this.events[event] = fn;
    };
    Socket.prototype.send = function (event, data, type) {
        if (type === 'ping')
            return this._socket.send(event);
        if (type === 'internal')
            return this._socket.send(messages_1.MessageFactory.internalMessage(event, data));
        if (type === 'publish')
            return this._socket.send(messages_1.MessageFactory.publishMessage(event, data));
        return this._socket.send(messages_1.MessageFactory.emitMessage(event, data));
    };
    Socket.prototype.disconnect = function (code, message) {
        return this._socket.close(code, message);
    };
    return Socket;
}());
exports.Socket = Socket;
