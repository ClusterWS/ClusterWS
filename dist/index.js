module.exports = function(e) {
    function t(n) {
        if (r[n]) return r[n].exports;
        var o = r[n] = {
            i: n,
            l: !1,
            exports: {}
        };
        return e[n].call(o.exports, o, o.exports, t), o.l = !0, o.exports;
    }
    var r = {};
    return t.m = e, t.c = r, t.d = function(e, r, n) {
        t.o(e, r) || Object.defineProperty(e, r, {
            configurable: !1,
            enumerable: !0,
            get: n
        });
    }, t.n = function(e) {
        var r = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return t.d(r, "a", r), r;
    }, t.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
    }, t.p = "", t(t.s = 4);
}([ function(e, t, r) {
    "use strict";
    function n(e) {
        console.log("[36m%s[0m", e);
    }
    function o(e) {
        console.log("[31m%s[0m", e);
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    }), t.logReady = n, t.logError = o;
}, function(e, t) {
    e.exports = require("cluster");
}, function(e, t, r) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var n = r(0), o = function() {
        function e() {
            this.events = {};
        }
        return e.prototype.on = function(e, t) {
            return t && "function" == typeof t ? this.events[e] ? this.events[e].push(t) : void (this.events[e] = [ t ]) : n.logError("Listener must be a function");
        }, e.prototype.emit = function(e) {
            for (var t = [], r = 1; r < arguments.length; r++) t[r - 1] = arguments[r];
            var n = this.events[e];
            if (n) {
                for (var o = 0, i = n.length; o < i; o++) (s = n[o]).call.apply(s, [ null ].concat(t));
                var s;
            }
        }, e.prototype.removeListener = function(e, t) {
            var r = this.events[e];
            if (r) for (var n = 0, o = r.length; n < o; n++) r[n] === t && this.events[e].splice(n, 1);
        }, e.prototype.removeEvent = function(e) {
            this.events[e] = null;
        }, e.prototype.removeEvents = function() {
            this.events = {};
        }, e;
    }();
    t.EventEmitter = o;
}, function(e, t, r) {
    "use strict";
    function n(e, t) {
        return {
            event: e,
            data: t
        };
    }
    function o(e, t) {
        return i.stringify({
            channel: e,
            data: t
        });
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var i = r(11);
    t.processMessage = n, t.brokerMessage = o;
}, function(e, t, r) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var n = r(1), o = r(5), i = r(12), s = function() {
        function e(e) {
            var t = {
                port: e.port || 80,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartOnFail: e.restartOnFail || !1
            };
            n.isMaster ? i.processMaster(t) : o.processWorker(t);
        }
        return e;
    }();
    t.ClusteWS = s;
}, function(e, t, r) {
    "use strict";
    function n(e) {
        process.on("message", function(t) {
            switch (t.event) {
              case "initWorker":
                break;

              case "initBroker":
                return new o.Worker(e, t.data);
            }
        }), process.on("uncaughtException", function(e) {
            return i.logError("PID: " + process.pid + "\n" + e.stack + "\n");
        });
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = r(6), i = r(0);
    t.processWorker = n;
}, function(e, t, r) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var n = r(7), o = r(0), i = r(8), s = r(10), c = r(2), u = r(3), f = function() {
        function e(e, t) {
            var r = this;
            this.options = e, this.id = t;
            var f = new i.TcpSocket(this.options.brokerPort, "127.0.0.1");
            f.on("error", function(e) {
                return o.logError("Worker, PID " + process.pid + "\n" + e.stack + "\n");
            }), f.on("message", function(e) {
                return "#0" === e ? f.send("#1") : r.socketServer.emitter.emit("#publish", JSON.parse(e));
            }), f.on("disconnect", function() {
                return o.logError("Something went wrong broker has been disconnected");
            }), this.socketServer = {
                middleware: {},
                emitter: new c.EventEmitter(),
                on: function(e, t) {
                    return r.socketServer.emitter.on(e, t);
                },
                publish: function(e, t) {
                    f.send(u.brokerMessage(e, t));
                }
            }, this.httpServer = s.createServer().listen(this.options.port), new n.Server({
                server: this.httpServer
            }).on("connection", function(e) {
                return r.socketServer.emitter.emit("connection");
            }), this.options.worker.call(this), process.send(u.processMessage("ready", process.pid));
        }
        return e;
    }();
    t.Worker = f;
}, function(e, t) {
    e.exports = require("uws");
}, function(e, t, r) {
    "use strict";
    var n = this && this.__extends || function() {
        var e = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(e, t) {
            e.__proto__ = t;
        } || function(e, t) {
            for (var r in t) t.hasOwnProperty(r) && (e[r] = t[r]);
        };
        return function(t, r) {
            function n() {
                this.constructor = t;
            }
            e(t, r), t.prototype = null === r ? Object.create(r) : (n.prototype = r.prototype, 
            new n());
        };
    }();
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = r(2), i = r(9), s = function(e) {
        function t(t, r) {
            var n = e.call(this) || this;
            return t instanceof i.Socket ? n.socket = t : n.socket = i.connect(t, r), n.socket.setKeepAlive(!0, 2e4), 
            n.socket.on("end", function() {
                return n.emit("disconnect");
            }), n.socket.on("error", function(e) {
                return n.emit("error", e);
            }), n.socket.on("connect", function() {
                return n.emit("connect");
            }), n.buffer = "", n.socket.on("data", function(e) {
                var t, r = 0;
                for (e = e.toString("utf8"); (t = e.indexOf("\n", r)) > -1; ) n.buffer += e.substring(r, t), 
                n.emit("message", n.buffer), n.buffer = "", r = t + 1;
                n.buffer += e.substring(r);
            }), n;
        }
        return n(t, e), t.prototype.send = function(e) {
            this.socket.write(e + "\n");
        }, t;
    }(o.EventEmitter);
    t.TcpSocket = s;
}, function(e, t) {
    e.exports = require("net");
}, function(e, t) {
    e.exports = require("http");
}, function(e, t, r) {
    "use strict";
    function n(e) {
        var t = s(e, !1);
        if (void 0 !== t) return "" + t;
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = Object.keys, i = Object.prototype.toString, s = function(e, t) {
        var r;
        if (!0 === e) return "true";
        if (!1 === e) return "false";
        switch (typeof e) {
          case "object":
            if (null === e) return null;
            var n = e.toJSON;
            if (n && "function" == typeof n) return s(n(), t);
            var c = i.call(e);
            if ("[object Array]" === c) {
                var u = "[", f = e.length;
                for (r = 0; r <= f; r++) u += s(e[r], !0) + ",";
                return f > 0 && (u += s(e[r], !0)), u + "]";
            }
            if ("[object Object]" === c) {
                var a = o(e).sort(), f = a.length, u = "";
                for (r = 0; r < f; ) {
                    var p = a[r], l = s(e[p], !1);
                    void 0 !== l && (u && (u += ","), u += JSON.stringify(p) + ":" + l), r++;
                }
                return "{" + u + "}";
            }
            return JSON.stringify(e);

          case "function":
          case "undefined":
            return t ? null : void 0;

          default:
            return isFinite(e) ? e : null;
        }
    };
    t.stringify = n;
}, function(e, t, r) {
    "use strict";
    function n(e) {
        var t = 0, r = [], n = function(n, i) {
            if (r[n] = 0 === n ? ">>> Broker on: " + e.brokerPort + ", PID " + i : "       Worker: " + n + ", PID " + i, 
            t++ >= e.workers) {
                o.logReady(">>> Master on: " + e.port + ", PID " + process.pid);
                for (var s in r) o.logReady(r[s]);
            }
        }, c = function(t, r) {
            var o = s.fork();
            o.on("message", function(e) {
                return "ready" === e.event ? n(r, e.data) : "";
            }), o.on("exit", function() {
                return e.restartOnFail ? c(t, r) : "";
            }), o.send(i.processMessage(t, r));
        };
        c("initBroker", 0);
        for (var u = 1; u <= e.workers; u++) c("initWorker", u);
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = r(0), i = r(3), s = r(1);
    t.processMaster = n;
} ]);