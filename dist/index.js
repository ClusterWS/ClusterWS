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
    }, r.p = "", r(r.s = 4);
}([ function(e, r, t) {
    "use strict";
    function n(e) {
        return console.log("[31m%s[0m", e);
    }
    function o(e) {
        return console.log("[36m%s[0m", e);
    }
    function i(e) {
        return console.log("[33m%s[0m", e);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.logError = n, r.logReady = o, r.logWarning = i;
}, function(e, r) {
    e.exports = require("cluster");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(3), o = t(0), i = function() {
        function e() {}
        return e.Client = function(r, t, i) {
            var s = new n(r);
            s.on("open", function() {
                return s.send(t);
            }), s.on("message", function(e) {
                return "#0" === e ? s.send("#1") : i.emit("#publish", JSON.parse(e.toString()));
            }), s.on("error", function(e) {
                return o.logError("Socket " + process.pid + " has an issue: \n" + e.stack + "\n");
            }), s.on("close", function(n, s) {
                if (4e3 === n) return o.logError("Socket had been disconnected please contact developers to fix this bug");
                o.logWarning("Something went wrong, socket will be reconnected"), e.Client(r, t, i);
            }), i.setBroker(s);
        }, e.Server = function(e, r) {
            function t(e) {
                if (e.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), 
                0 === i.length) return i.push(e);
                for (var r = 0, n = i.length; r < n; r++) {
                    if (i[r].id === e.id) return t(e);
                    if (r === n - 1) return i.push(e);
                }
            }
            var i = [], s = new n.Server({
                port: e.brokerPort
            }, function() {
                return process.send({
                    event: "Ready",
                    data: process.pid
                });
            });
            s.on("connection", function(e) {
                var n = !1, o = setTimeout(function() {
                    return e.close(4e3, "Not Authenticated");
                }, 5e3), s = setInterval(function() {
                    return e.send("#0");
                }, 2e4);
                e.on("message", function(s) {
                    if ("#1" !== s) {
                        if (s === r.internalKey) return n = !0, t(e), clearTimeout(o);
                        if (n) for (var c = 0, u = i.length; c < u; c++) i[c].id !== e.id && i[c].send(s);
                    }
                }), e.on("close", function() {
                    if (clearTimeout(o), clearInterval(s), n) for (var r = 0, t = i.length; r < t; r++) if (i[r].id === e.id) return i.splice(r, 1);
                });
            }), s.on("error", function(e) {
                return o.logError("Broker " + process.pid + " has an issue: \n" + e.stack + "\n");
            });
        }, e;
    }();
    r.Broker = i;
}, function(e, r) {
    e.exports = require("uws");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(1), o = t(0), i = t(5), s = t(6), c = function() {
        function e(e) {
            if (!e.worker || "[object Function]" !== {}.toString.call(e.worker)) return o.logError("Worker must be provided and it must be a function \n \n");
            var r = {
                port: e.port || 80,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartWorkerOnFail: e.restartWorkerOnFail || !1
            };
            n.isMaster ? i.masterProcess(r) : s.workerProcess(r);
        }
        return e;
    }();
    r.ClusterWS = c;
    var u = Buffer.from("mytext");
    console.log(Buffer.isBuffer(u)), console.log(u);
}, function(e, r, t) {
    "use strict";
    function n(e) {
        function r(n, s) {
            var u = o.fork();
            u.on("exit", function() {
                i.logWarning(n + " has been disconnected \n"), e.restartWorkerOnFail && (i.logWarning(n + " is restarting \n"), 
                r(n, s));
            }), u.on("message", function(e) {
                return "Ready" === e.event ? t(s, e.data, n) : "";
            }), u.send({
                event: n,
                data: {
                    internalKey: c,
                    index: s
                }
            });
        }
        function t(t, o, c) {
            if (n) return i.logReady(c + " has been restarted");
            if (0 === t) {
                for (var u = 1; u <= e.workers; u++) r("Worker", u);
                return s[t] = ">>> " + c + " on: " + e.brokerPort + ", PID " + o;
            }
            if (s[t] = "       " + c + ": " + t + ", PID " + o, Object.keys(s).length === e.workers + 1) {
                n = !0, i.logReady(">>> Master on: " + e.port + ", PID: " + process.pid);
                for (var a in s) s[a] && i.logReady(s[a]);
            }
        }
        var n = !1, s = {}, c = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        r("Broker", 0);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(1), i = t(0);
    r.masterProcess = n;
}, function(e, r, t) {
    "use strict";
    function n(e) {
        process.on("message", function(r) {
            switch (r.event) {
              case "Broker":
                return i.Broker.Server(e, r.data);

              case "Worker":
                return new s.Worker(e, r.data);
            }
        }), process.on("uncaughtException", function(r) {
            if (o.logError("PID: " + process.pid + "\n" + r.stack + "\n"), e.restartWorkerOnFail) return process.exit();
        });
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(0), i = t(2), s = t(7);
    r.workerProcess = n;
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(3), o = t(2), i = t(8), s = t(9), c = function() {
        function e(e, r) {
            var t = this;
            this.options = e, this.httpServer = i.createServer(), this.socketServer = new s.SocketServer(), 
            o.Broker.Client("ws://127.0.0.1:" + e.brokerPort, r.internalKey, this.socketServer), 
            new n.Server({
                server: this.httpServer
            }).on("connection", function(e) {
                return t.socketServer.emit("connection", t.socketServer.createSocket(e));
            }), this.httpServer.listen(this.options.port, function() {
                t.options.worker.call(t), process.send({
                    event: "Ready",
                    data: process.pid
                });
            });
        }
        return e;
    }();
    r.Worker = c;
}, function(e, r) {
    e.exports = require("http");
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
    var o = t(10), i = function(e) {
        function r() {
            var r = e.call(this) || this;
            return r.middleware = {}, r;
        }
        return n(r, e), r.prototype.createSocket = function(e) {}, r.prototype.publish = function(e, r) {
            this.brokerSocket.send(Buffer.from(JSON.stringify({
                channel: e,
                data: r
            }))), this.emit("#publish", {
                channel: e,
                data: r
            });
        }, r.prototype.setBroker = function(e) {
            this.brokerSocket = e;
        }, r;
    }(o.EventEmitter);
    r.SocketServer = i;
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
                for (var o = 0, i = n.length; o < i; o++) (s = n[o]).call.apply(s, [ null ].concat(r));
                var s;
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
} ]);