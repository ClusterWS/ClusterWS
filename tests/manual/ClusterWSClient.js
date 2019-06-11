"use strict";

function isFunction(t) {
    return "function" == typeof t;
}

var EventEmitter = function() {
    function t() {
        this.events = {};
    }
    return t.prototype.on = function(t, e) {
        if (!isFunction(e)) throw new Error("Listener must be a function");
        this.events[t] = e;
    }, t.prototype.emit = function(t) {
        for (var e = [], n = 1; n < arguments.length; n++) e[n - 1] = arguments[n];
        var s = this.events[t];
        s && s.apply(void 0, e);
    }, t.prototype.exist = function(t) {
        return !!this.events[t];
    }, t.prototype.off = function(t) {
        delete this.events[t];
    }, t.prototype.removeEvents = function() {
        this.events = {};
    }, t;
}();

function decode(t, e) {
    var n = e[0], s = e[1], i = e[2];
    if ("e" === n) return t.emitter.emit(s, i);
    if ("p" === n) for (var o = 0, r = (h = Object.keys(i)).length; o < r; o++) for (var c = i[p = h[o]], a = 0, u = c.length; a < u; a++) t.channels.channelNewMessage(p, c[a]);
    if ("s" === n) {
        if ("s" === s) {
            var h;
            for (o = 0, r = (h = Object.keys(i)).length; o < r; o++) {
                var p = h[o];
                t.channels.channelSetStatus(p, i[p]);
            }
        }
        "c" === s && (t.autoPing = i.autoPing, t.pingInterval = i.pingInterval, t.resetPing());
    }
}

function encode(t, e, n) {
    var s = {
        emit: [ "e", t, e ],
        publish: [ "p", t, e ],
        system: {
            subscribe: [ "s", "s", e ],
            unsubscribe: [ "s", "u", e ],
            configuration: [ "s", "c", e ]
        }
    };
    return "system" === n ? JSON.stringify(s[n][t]) : JSON.stringify(s[n]);
}

var Channel = function() {
    function t(t, e) {
        this.client = t, this.name = e, this.READY = 1, this.status = 0, this.events = {}, 
        this.watchers = [], this.client.readyState === this.client.OPEN && this.client.send("subscribe", [ this.name ], "system");
    }
    return t.prototype.on = function(t, e) {
        this.events[t] = e;
    }, t.prototype.publish = function(t) {
        this.status === this.READY && this.client.send(this.name, t, "publish");
    }, t.prototype.setWatcher = function(t) {
        this.watchers.push(t);
    }, t.prototype.removeWatcher = function(t) {
        for (var e = 0, n = this.watchers.length; e < n; e++) if (this.watchers[e] === t) {
            this.watchers.splice(e, 1);
            break;
        }
    }, t.prototype.unsubscribe = function() {
        this.status = 0, this.emit("unsubscribed"), this.client.channels.removeChannel(this.name), 
        this.client.send("unsubscribe", this.name, "system");
    }, t.prototype.emit = function(t) {
        var e = this.events[t];
        e && e();
    }, t.prototype.broadcast = function(t) {
        for (var e = 0, n = this.watchers.length; e < n; e++) this.watchers[e](t);
    }, t;
}(), Channels = function() {
    function t(t) {
        this.client = t, this.channels = {};
    }
    return t.prototype.subscribe = function(t) {
        if (!this.channels[t]) {
            var e = new Channel(this.client, t);
            return this.channels[t] = e, e;
        }
    }, t.prototype.resubscribe = function() {
        var t = Object.keys(this.channels);
        t.length && this.client.send("subscribe", t, "system");
    }, t.prototype.getChannelByName = function(t) {
        return this.channels[t] || null;
    }, t.prototype.channelNewMessage = function(t, e) {
        var n = this.channels[t];
        n && n.status === n.READY && n.broadcast(e);
    }, t.prototype.channelSetStatus = function(t, e) {
        var n = this.channels[t];
        if (n) {
            if (!e) return n.emit("canceled"), this.removeChannel(t);
            n.status = 1, n.emit("subscribed");
        }
    }, t.prototype.removeChannel = function(t) {
        delete this.channels[t];
    }, t.prototype.removeAllChannels = function() {
        this.channels = {};
    }, t;
}(), Socket = window.MozWebSocket || window.WebSocket, PONG = new Uint8Array([ "A".charCodeAt(0) ]).buffer, ClusterWS = function() {
    function t(t) {
        if (this.reconnectAttempts = 0, this.options = {
            url: t.url,
            autoConnect: !1 !== t.autoConnect,
            autoReconnect: t.autoReconnect || !1,
            autoResubscribe: !1 !== t.autoResubscribe,
            autoReconnectOptions: {
                attempts: t.autoReconnectOptions && t.autoReconnectOptions.attempts || 0,
                minInterval: t.autoReconnectOptions && t.autoReconnectOptions.minInterval || 500,
                maxInterval: t.autoReconnectOptions && t.autoReconnectOptions.maxInterval || 2e3
            }
        }, !this.options.url) throw new Error("url must be provided");
        this.emitter = new EventEmitter(), this.channels = new Channels(this), this.reconnectAttempts = this.options.autoReconnectOptions.attempts, 
        this.options.autoConnect && this.connect();
    }
    return Object.defineProperty(t.prototype, "OPEN", {
        get: function() {
            return this.socket.OPEN;
        },
        enumerable: !0,
        configurable: !0
    }), Object.defineProperty(t.prototype, "CLOSED", {
        get: function() {
            return this.socket.CLOSED;
        },
        enumerable: !0,
        configurable: !0
    }), Object.defineProperty(t.prototype, "readyState", {
        get: function() {
            return this.socket ? this.socket.readyState : 0;
        },
        enumerable: !0,
        configurable: !0
    }), Object.defineProperty(t.prototype, "binaryType", {
        get: function() {
            return this.socket.binaryType;
        },
        set: function(t) {
            this.socket.binaryType = t;
        },
        enumerable: !0,
        configurable: !0
    }), t.prototype.connect = function() {
        var t = this;
        if (this.isCreated) throw new Error("Connect event has been called multiple times");
        this.isCreated = !0, this.socket = new Socket(this.options.url), this.socket.onopen = function() {
            t.reconnectAttempts = t.options.autoReconnectOptions.attempts, t.options.autoResubscribe ? t.channels.resubscribe() : t.channels.removeAllChannels(), 
            t.emitter.emit("open");
        }, this.socket.onclose = function(e, n) {
            clearTimeout(t.pingTimeout), t.isCreated = !1;
            var s = "number" == typeof e ? e : e.code, i = "number" == typeof e ? n : e.reason;
            if (t.emitter.emit("close", s, i), t.options.autoReconnect && 1e3 !== s && t.readyState === t.CLOSED && (0 === t.options.autoReconnectOptions.attempts || t.reconnectAttempts > 0)) return t.reconnectAttempts--, 
            setTimeout(function() {
                t.connect();
            }, Math.floor(Math.random() * (t.options.autoReconnectOptions.maxInterval - t.options.autoReconnectOptions.minInterval + 1)));
            t.emitter.removeEvents(), t.channels.removeAllChannels();
        }, this.socket.onmessage = function(e) {
            var n = e;
            e.data && (n = e.data), t.parsePing(n, function() {
                if (t.emitter.exist("message")) return t.emitter.emit("message", n);
                t.processMessage(n);
            });
        }, this.socket.onerror = function(e) {
            if (t.emitter.exist("error")) return t.emitter.emit("error", e);
            throw t.close(), new Error("Connect event has been called multiple times");
        };
    }, t.prototype.on = function(t, e) {
        this.emitter.on(t, e);
    }, t.prototype.send = function(t, e, n) {
        return void 0 === n && (n = "emit"), void 0 === e ? this.socket.send(t) : this.socket.send(encode(t, e, n));
    }, t.prototype.close = function(t, e) {
        this.socket.close(t || 1e3, e);
    }, t.prototype.subscribe = function(t) {
        return this.channels.subscribe(t);
    }, t.prototype.getChannelByName = function(t) {
        return this.channels.getChannelByName(t);
    }, t.prototype.processMessage = function(t) {
        try {
            if (t instanceof Array) return decode(this, t);
            if ("string" != typeof t) {
                var e = new Error("processMessage accepts only string or array types");
                if (this.emitter.exist("error")) return this.emitter.emit("error", e);
                throw e;
            }
            if ("[" !== t[0]) {
                e = new Error("processMessage received incorrect message");
                if (this.emitter.exist("error")) return this.emitter.emit("error", e);
                throw e;
            }
            return decode(this, JSON.parse(t));
        } catch (e) {
            if (this.emitter.exist("error")) return this.emitter.emit("error", e);
            throw this.close(), e;
        }
    }, t.prototype.parsePing = function(t, e) {
        var n = this;
        if (1 === t.size || 1 === t.byteLength) {
            var s = function(t) {
                return 57 === new Uint8Array(t)[0] ? (n.resetPing(), n.socket.send(PONG), n.emitter.emit("ping")) : e();
            };
            if (!(t instanceof ArrayBuffer)) {
                var i = new FileReader();
                return i.onload = function(t) {
                    return s(t.srcElement.result);
                }, i.readAsArrayBuffer(t);
            }
            return s(t);
        }
        return e();
    }, t.prototype.resetPing = function() {
        var t = this;
        clearTimeout(this.pingTimeout), this.pingInterval && this.autoPing && (this.pingTimeout = setTimeout(function() {
            t.close(4001, "No ping received in " + (t.pingInterval + 500) + "ms");
        }, this.pingInterval + 500));
    }, t;
}();

module.exports = ClusterWS; module.exports.default = ClusterWS;
