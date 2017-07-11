"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = (function () {
    function EventEmitter() {
        this._events = {};
    }
    EventEmitter.prototype.on = function (event, listener) {
        if (!listener)
            throw 'Function must be provided';
        if (!this._events[event]) {
            this._events[event] = [];
        }
        return this._events[event].push(listener);
    };
    EventEmitter.prototype.emit = function (event, data) {
        if (this._events[event]) {
            for (var i = 0, len = this._events[event].length; i < len; i++) {
                if (typeof this._events[event][i] === 'function') {
                    this._events[event][i].call(this, data);
                }
            }
        }
    };
    EventEmitter.prototype.removeListener = function (event, listener) {
        if (this._events[event]) {
            var len = this._events[event].length;
            while (len--) {
                if (this._events[event][len] === listener) {
                    this._events[event].splice(len, 1);
                }
            }
        }
        return;
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
