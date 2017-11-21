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
    }, r.p = "", r(r.s = 5);
}([ function(e, r, t) {
    "use strict";
    function n(e) {
        return console.log("[31m%s[0m", e);
    }
    function o(e) {
        return console.log("[36m%s[0m", e);
    }
    function s(e) {
        return console.log("[33m%s[0m", e);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.logError = n, r.logReady = o, r.logWarning = s;
}, function(e, r) {
    e.exports = require("cluster");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(3), o = t(0), s = function() {
        function e() {}
        return e.Client = function(r, t, s) {
            var i = new n(r);
            i.on("open", function() {
                return i.send(t);
            }), i.on("message", function(e) {
                return "#0" === e ? i.send("#1") : s.emit("#publish", JSON.parse(Buffer.from(e).toString()));
            }), i.on("error", function(e) {
                return o.logError("Socket " + process.pid + " has an issue: \n" + e.stack + "\n");
            }), i.on("close", function(n, i) {
                if (4e3 === n) return o.logError("Socket had been disconnected please contact developers to fix this bug");
                o.logWarning("Something went wrong, socket will be reconnected"), e.Client(r, t, s);
            }), s.setBroker(i);
        }, e.Server = function(e, r) {
            function t(e) {
                if (e.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), 
                0 === s.length) return s.push(e);
                for (var r = 0, n = s.length; r < n; r++) {
                    if (s[r].id === e.id) return t(e);
                    if (r === n - 1) return s.push(e);
                }
            }
            var s = [], i = new n.Server({
                port: e.brokerPort
            }, function() {
                return process.send({
                    event: "Ready",
                    data: process.pid
                });
            });
            i.on("connection", function(e) {
                var n = !1, o = setTimeout(function() {
                    return e.close(4e3, "Not Authenticated");
                }, 5e3), i = setInterval(function() {
                    return e.send("#0");
                }, 2e4);
                e.on("message", function(i) {
                    if ("#1" !== i) {
                        if (i === r.internalKey) return n = !0, t(e), clearTimeout(o);
                        if (n) for (var c = 0, u = s.length; c < u; c++) s[c].id !== e.id && s[c].send(i);
                    }
                }), e.on("close", function() {
                    if (clearTimeout(o), clearInterval(i), n) for (var r = 0, t = s.length; r < t; r++) if (s[r].id === e.id) return s.splice(r, 1);
                });
            }), i.on("error", function(e) {
                return o.logError("Broker " + process.pid + " has an issue: \n" + e.stack + "\n");
            });
        }, e;
    }();
    r.Broker = s;
}, function(e, r) {
    e.exports = require("uws");
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
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(1), o = t(0), s = t(6), i = t(7), c = function() {
        function e(e) {
            if (!e.worker || "[object Function]" !== {}.toString.call(e.worker)) return o.logError("Worker must be provided and it must be a function \n \n");
            var r = {
                port: e.port || 80,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartWorkerOnFail: e.restartWorkerOnFail || !1,
                useBinary: e.useBinary || !1
            };
            n.isMaster ? s.masterProcess(r) : i.workerProcess(r);
        }
        return e;
    }();
    r.ClusterWS = c;
}, function(e, r, t) {
    "use strict";
    function n(e) {
        function r(n, i) {
            var u = o.fork();
            u.on("exit", function() {
                s.logWarning(n + " has been disconnected \n"), e.restartWorkerOnFail && (s.logWarning(n + " is restarting \n"), 
                r(n, i));
            }), u.on("message", function(e) {
                return "Ready" === e.event ? t(i, e.data, n) : "";
            }), u.send({
                event: n,
                data: {
                    internalKey: c,
                    index: i
                }
            });
        }
        function t(t, o, c) {
            if (n) return s.logReady(c + " has been restarted");
            if (0 === t) {
                for (var u = 1; u <= e.workers; u++) r("Worker", u);
                return i[t] = ">>> " + c + " on: " + e.brokerPort + ", PID " + o;
            }
            if (i[t] = "       " + c + ": " + t + ", PID " + o, Object.keys(i).length === e.workers + 1) {
                n = !0, s.logReady(">>> Master on: " + e.port + ", PID: " + process.pid);
                for (var a in i) i[a] && s.logReady(i[a]);
            }
        }
        var n = !1, i = {}, c = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        r("Broker", 0);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(1), s = t(0);
    r.masterProcess = n;
}, function(e, r, t) {
    "use strict";
    function n(e) {
        process.on("message", function(r) {
            switch (r.event) {
              case "Broker":
                return s.Broker.Server(e, r.data);

              case "Worker":
                return new i.Worker(e, r.data);
            }
        }), process.on("uncaughtException", function(r) {
            if (o.logError("PID: " + process.pid + "\n" + r.stack + "\n"), e.restartWorkerOnFail) return process.exit();
        });
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(0), s = t(2), i = t(8);
    r.workerProcess = n;
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(3), o = t(2), s = t(9), i = t(10), c = t(11), u = function() {
        function e(e, r) {
            var t = this;
            this.options = e, this.httpServer = s.createServer(), this.socketServer = new i.SocketServer(), 
            o.Broker.Client("ws://127.0.0.1:" + e.brokerPort, r.internalKey, this.socketServer), 
            new n.Server({
                server: this.httpServer
            }).on("connection", function(e) {
                return t.socketServer.emit("connection", new c.Socket(e, t));
            }), this.httpServer.listen(this.options.port, function() {
                t.options.worker.call(t), process.send({
                    event: "Ready",
                    data: process.pid
                });
            });
        }
        return e;
    }();
    r.Worker = u;
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
    var o = t(4), s = function(e) {
        function r() {
            var r = e.call(this) || this;
            return r.middleware = {}, r;
        }
        return n(r, e), r.prototype.publish = function(e, r) {
            this.socketBroker.send(Buffer.from(JSON.stringify({
                channel: e,
                data: r
            }))), this.emit("#publish", {
                channel: e,
                data: r
            });
        }, r.prototype.setBroker = function(e) {
            this.socketBroker = e;
        }, r;
    }(o.EventEmitter);
    r.SocketServer = s;
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(4), o = t(0), s = t(12), i = function() {
        function e(e, r) {
            var t = this;
            this.socket = e, this.server = r, this.channels = [], this.events = new n.EventEmitter(), 
            this.missedPing = 0;
            var i = function(e) {
                return -1 !== t.channels.indexOf(e.channel) ? t.send(e.channel, e.data, "publish") : "";
            };
            this.server.socketServer.on("#publish", i);
            var c = setInterval(function() {
                if (t.missedPing++ > 2) return t.disconnect(4001, "Did not get pongs");
                t.send("#0", null, "ping");
            }, this.server.options.pingInterval);
            this.send("configuration", {
                ping: this.server.options.pingInterval,
                binary: this.server.options.useBinary
            }, "system"), this.socket.on("error", function(e) {
                return t.events.emit("error", e);
            }), this.socket.on("message", function(e) {
                if (t.server.options.useBinary && "string" != typeof e && (e = Buffer.from(e).toString()), 
                "#" === e[0] && "1" === e[1]) return t.missedPing = 0;
                try {
                    e = JSON.parse(e);
                } catch (e) {
                    return o.logError("PID: " + process.pid + "\n" + e + "\n");
                }
                s.socketDecodeMessages(t, e);
            }), this.socket.on("close", function(e, r) {
                clearInterval(c), t.events.emit("disconnect", e, r), t.server.socketServer.removeListener("#publish", i);
                for (var n in t) t.hasOwnProperty(n) && delete t[n];
            });
        }
        return e.prototype.on = function(e, r) {
            this.events.on(e, r);
        }, e.prototype.send = function(e, r, t) {
            if (this.server.options.useBinary && "configuration" !== e) return this.socket.send(Buffer.from(s.socketEncodeMessages(e, r, t || "emit")));
            this.socket.send(s.socketEncodeMessages(e, r, t || "emit"));
        }, e.prototype.disconnect = function(e, r) {
            this.socket.close(e, r);
        }, e;
    }();
    r.Socket = i;
}, function(e, r, t) {
    "use strict";
    function n(e, r, t) {
        switch (t) {
          case "ping":
            return e;

          case "emit":
            return JSON.stringify({
                "#": [ "e", e, r ]
            });

          case "publish":
            return JSON.stringify({
                "#": [ "p", e, r ]
            });

          case "system":
            switch (e) {
              case "subsribe":
                return JSON.stringify({
                    "#": [ "s", "s", r ]
                });

              case "unsubscribe":
                return JSON.stringify({
                    "#": [ "s", "u", r ]
                });

              case "configuration":
                return JSON.stringify({
                    "#": [ "s", "c", r ]
                });
            }
        }
    }
    function o(e, r) {
        switch (r["#"][0]) {
          case "e":
            return e.events.emit(r["#"][1], r["#"][2]);

          case "p":
            return -1 !== e.channels.indexOf(r["#"][1]) ? e.server.socketServer.publish(r["#"][1], r["#"][2]) : "";

          case "s":
            switch (r["#"][1]) {
              case "s":
                var t = function() {
                    return -1 === e.channels.indexOf(r["#"][2]) ? e.channels.push(r["#"][2]) : "";
                };
                return e.server.socketServer.middleware.onSubscribe ? e.server.socketServer.middleware.onSubscribe(e, r["#"][2], function(e) {
                    return e ? "" : t();
                }) : t();

              case "u":
                var n = e.channels.indexOf(r["#"][2]);
                if (-1 !== n) return e.channels.splice(n, 1);
            }
        }
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.socketEncodeMessages = n, r.socketDecodeMessages = o;
} ]);