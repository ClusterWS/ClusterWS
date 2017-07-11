"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventEmitter = (function () {
    function EventEmitter() {
        this.events = {};
    }
    EventEmitter.prototype.on = function (event, listener) {
        if (!listener)
            throw 'Function must be provided';
        if (!this.events[event]) {
            this.events[event] = [];
        }
        return this.events[event].push(listener);
    };
    EventEmitter.prototype.emit = function (event, data) {
        if (this.events[event]) {
            for (var i = 0, len = this.events[event].length; i < len; i++) {
                this.events[event][i].call(this, data);
            }
        }
    };
    EventEmitter.prototype.removeListener = function (event, listener) {
        if (this.events[event]) {
            var len = this.events[event].length;
            var i = 0;
            while (i < len) {
                if (this.events[event][i] === listener) {
                    this.events[event].splice(i, 1);
                    len--;
                }
                else {
                    i++;
                }
            }
        }
        return;
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
