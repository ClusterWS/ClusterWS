module.exports = function(e) {
    function r(n) {
        if (t[n]) return t[n].exports;
        var o = t[n] = {
            i: n,
            l: !1,
            exports: {}
        };
        return e[n].call(o.exports, o, o.exports, r), o.l = !0, o.exports;
    }
    var t = {};
    return r.m = e, r.c = t, r.d = function(e, t, n) {
        r.o(e, t) || Object.defineProperty(e, t, {
            configurable: !1,
            enumerable: !0,
            get: n
        });
    }, r.n = function(e) {
        var t = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return r.d(t, "a", t), t;
    }, r.o = function(e, r) {
        return Object.prototype.hasOwnProperty.call(e, r);
    }, r.p = "", r(r.s = 6);
}([ function(e, r, t) {
    "use strict";
    function n(e) {
        console.log("[36m%s[0m", e);
    }
    function o(e) {
        console.log("[31m%s[0m", e);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.logReady = n, r.logError = o;
}, function(e, r, t) {
    "use strict";
    function n(e, r) {
        return {
            event: e,
            data: r
        };
    }
    function o(e, r) {
        return JSON.stringify({
            channel: e,
            data: r
        });
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.processMessage = n, r.brokerMessage = o;
}, function(e, r) {
    e.exports = require("cluster");
}, function(e, r, t) {
    "use strict";
    var n = this && this.__extends || function() {
        var e = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(e, r) {
            e.__proto__ = r;
        } || function(e, r) {
            for (var t in r) r.hasOwnProperty(t) && (e[t] = r[t]);
        };
        return function(r, t) {
            function n() {
                this.constructor = r;
            }
            e(r, t), r.prototype = null === t ? Object.create(t) : (n.prototype = t.prototype, 
            new n());
        };
    }();
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(4), s = t(5), i = function(e) {
        function r(r, t) {
            var n = e.call(this) || this;
            r instanceof s.Socket ? n.socket = r : n.socket = s.connect(r, t), n.socket.setKeepAlive(!0, 2e4), 
            n.socket.on("end", function() {
                return n.emit("disconnect");
            }), n.socket.on("error", function(e) {
                return n.emit("error", e);
            }), n.socket.on("connect", function() {
                return n.emit("connect");
            });
            var o = "";
            return n.socket.on("data", function(e) {
                var r, t = 0;
                for (e = e.toString("utf8"); (r = e.indexOf("\n", t)) > -1; ) o += e.substring(t, r), 
                n.emit("message", o), o = "", t = r + 1;
                o += e.substring(t);
            }), n;
        }
        return n(r, e), r.prototype.send = function(e) {
            this.socket.write(e + "\n");
        }, r;
    }(o.EventEmitter);
    r.TcpSocket = i;
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(0), o = function() {
        function e() {
            this.events = {};
        }
        return e.prototype.on = function(e, r) {
            return r && "function" == typeof r ? this.events[e] ? this.events[e].push(r) : void (this.events[e] = [ r ]) : n.logError("Listener must be a function");
        }, e.prototype.emit = function(e) {
            for (var r = [], t = 1; t < arguments.length; t++) r[t - 1] = arguments[t];
            var n = this.events[e];
            if (n) {
                for (var o = 0, s = n.length; o < s; o++) (i = n[o]).call.apply(i, [ null ].concat(r));
                var i;
            }
        }, e.prototype.removeListener = function(e, r) {
            var t = this.events[e];
            if (t) for (var n = 0, o = t.length; n < o; n++) t[n] === r && this.events[e].splice(n, 1);
        }, e.prototype.removeEvent = function(e) {
            this.events[e] = null;
        }, e.prototype.removeEvents = function() {
            this.events = {};
        }, e;
    }();
    r.EventEmitter = o;
}, function(e, r) {
    e.exports = require("net");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(2), o = t(7), s = t(12), i = function() {
        function e(e) {
            var r = {
                port: e.port || 80,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartOnFail: e.restartOnFail || !1
            };
            n.isMaster ? s.processMaster(r) : o.processWorker(r);
        }
        return e;
    }();
    r.ClusteWS = i;
}, function(e, r, t) {
    "use strict";
    function n(e) {
        process.on("message", function(r) {
            switch (r.event) {
              case "initWorker":
                return new s.Broker(e, r.data);

              case "initBroker":
                return new o.Worker(e, r.data);
            }
        }), process.on("uncaughtException", function(e) {
            return i.logError("PID: " + process.pid + "\n" + e.stack + "\n");
        });
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(8), s = t(11), i = t(0);
    r.processWorker = n;
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(9), o = t(0), s = t(3), i = t(10), c = t(4), u = t(1), a = function() {
        function e(e, r) {
            var t = this;
            this.options = e, this.id = r;
            var a = new s.TcpSocket(this.options.brokerPort, "127.0.0.1");
            a.on("error", function(e) {
                return o.logError("Worker, PID " + process.pid + "\n" + e.stack + "\n");
            }), a.on("message", function(e) {
                return "#0" === e ? a.send("#1") : t.socketServer.emitter.emit("#publish", JSON.parse(e));
            }), a.on("disconnect", function() {
                return o.logError("Something went wrong broker has been disconnected");
            }), this.socketServer = {
                middleware: {},
                emitter: new c.EventEmitter(),
                on: function(e, r) {
                    return t.socketServer.emitter.on(e, r);
                },
                publish: function(e, r) {
                    a.send(u.brokerMessage(e, r)), t.socketServer.emitter.emit("#publish", {
                        channel: e,
                        data: r
                    });
                }
            }, this.httpServer = i.createServer().listen(this.options.port), new n.Server({
                server: this.httpServer
            }).on("connection", function(e) {
                return t.socketServer.emitter.emit("connection");
            }), this.options.worker.call(this), process.send(u.processMessage("ready", process.pid));
        }
        return e;
    }();
    r.Worker = a;
}, function(e, r) {
    e.exports = require("uws");
}, function(e, r) {
    e.exports = require("http");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(0), o = t(3), s = t(5), i = t(1), c = function() {
        function e(e, r) {
            var t = this;
            this.options = e, this.id = r, this.servers = [], s.createServer(function(e) {
                var r = new o.TcpSocket(e), s = t.servers.length;
                t.servers[s] = r, setInterval(function() {
                    return r.send("#0");
                }, 2e4), r.on("error", function(e) {
                    return n.logError("Broker, PID " + process.pid + "\n" + e.stack + "\n");
                }), r.on("message", function(e) {
                    return "#1" !== e ? t.broadcast(s, e) : "";
                }), r.on("disconnect", function() {
                    return n.logError("Server " + s + " has disconnected");
                });
            }).listen(e.brokerPort), process.send(i.processMessage("ready", process.pid));
        }
        return e.prototype.broadcast = function(e, r) {
            for (var t = 0, n = this.servers.length; t < n; t++) t !== e && this.servers[t].send(r);
        }, e;
    }();
    r.Broker = c;
}, function(e, r, t) {
    "use strict";
    function n(e) {
        var r = 0, t = [], n = function(n, s) {
            if (t[n] = 0 === n ? ">>> Broker on: " + e.brokerPort + ", PID " + s : "       Worker: " + n + ", PID " + s, 
            r++ >= e.workers) {
                o.logReady(">>> Master on: " + e.port + ", PID " + process.pid);
                for (var i in t) o.logReady(t[i]);
            }
        }, c = function(r, t) {
            var o = i.fork();
            o.on("message", function(e) {
                return "ready" === e.event ? n(t, e.data) : "";
            }), o.on("exit", function() {
                return e.restartOnFail ? c(r, t) : "";
            }), o.send(s.processMessage(r, t));
        };
        c("initBroker", 0);
        for (var u = 1; u <= e.workers; u++) c("initWorker", u);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(0), s = t(1), i = t(2);
    r.processMaster = n;
} ]);