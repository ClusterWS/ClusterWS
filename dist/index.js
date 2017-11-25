module.exports = function(e) {
    function r(t) {
        if (n[t]) return n[t].exports;
        var o = n[t] = {
            i: t,
            l: !1,
            exports: {}
        };
        return e[t].call(o.exports, o, o.exports, r), o.l = !0, o.exports;
    }
    var n = {};
    return r.m = e, r.c = n, r.d = function(e, n, t) {
        r.o(e, n) || Object.defineProperty(e, n, {
            configurable: !1,
            enumerable: !0,
            get: t
        });
    }, r.n = function(e) {
        var n = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return r.d(n, "a", n), n;
    }, r.o = function(e, r) {
        return Object.prototype.hasOwnProperty.call(e, r);
    }, r.p = "", r(r.s = 6);
}([ function(e, r, n) {
    "use strict";
    function t(e) {
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
    }), r.logError = t, r.logReady = o, r.logWarning = s;
}, function(e, r) {
    e.exports = require("cluster");
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(3), o = n(0), s = n(4), i = function() {
        function e() {}
        return e.Client = function(r, n, i, c) {
            var a = new t(r), u = i instanceof s.SocketServer;
            a.on("open", function() {
                c && o.logReady("Socket has been reconnected"), a.send(n);
            }), a.on("error", function(t) {
                if ("uWs client connection error" === t.stack) return e.Client(r, n, i, !0);
                o.logError("Socket " + process.pid + " has an issue: \n" + t.stack + "\n");
            }), a.on("message", function(e) {
                if ("#0" === e) return a.send("#1");
                u ? i.emit("#publish", JSON.parse(Buffer.from(e).toString())) : i.send("", e);
            }), a.on("close", function(t, s) {
                if (4e3 === t) return o.logError("Wrong or no authenticated key was provided");
                o.logWarning("Something went wrong, socket will be reconnected as soon as possible"), 
                e.Client(r, n, i, !0);
            }), i.setBroker(a);
        }, e.Server = function(r, n) {
            function s(e, r) {
                for (var n = 0, t = a.length; n < t; n++) a[n].id !== e && a[n].send(r);
            }
            function i(e) {
                if (e.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), 
                0 === a.length) return a.push(e);
                for (var r = 0, n = a.length; r < n; r++) {
                    if (a[r].id === e.id) return i(e);
                    if (r === n - 1) return a.push(e);
                }
            }
            var c, a = [], u = new t.Server({
                port: r
            }, function() {
                return process.send({
                    event: "Ready",
                    data: process.pid
                });
            });
            if (u.on("connection", function(e) {
                var r = !1, t = setTimeout(function() {
                    return e.close(4e3, "Not Authenticated");
                }, 5e3), o = setInterval(function() {
                    return e.send("#0");
                }, 2e4);
                e.on("message", function(o) {
                    if ("#1" !== o) return o === n.key ? (r = !0, i(e), clearTimeout(t)) : void (r && (s(e.id, o), 
                    n.machineScale && c.send(o)));
                }), e.on("close", function() {
                    if (clearTimeout(t), clearInterval(o), r) for (var n = 0, s = a.length; n < s; n++) if (a[n].id === e.id) return a.splice(n, 1);
                });
            }), n.machineScale) {
                var f = n.machineScale.master ? "127.0.0.1:" : n.machineScale.url + ":";
                e.Client("ws://" + f + n.machineScale.port, n.machineScale.externalKey || "", {
                    send: s,
                    setBroker: function(e) {
                        return c = e;
                    }
                });
            }
            u.on("error", function(e) {
                return o.logError("Broker " + process.pid + " has an issue: \n" + e.stack + "\n");
            });
        }, e;
    }();
    r.Broker = i;
}, function(e, r) {
    e.exports = require("uws");
}, function(e, r, n) {
    "use strict";
    var t = this && this.__extends || function() {
        var e = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(e, r) {
            e.__proto__ = r;
        } || function(e, r) {
            for (var n in r) r.hasOwnProperty(n) && (e[n] = r[n]);
        };
        return function(r, n) {
            function t() {
                this.constructor = r;
            }
            e(r, n), r.prototype = null === n ? Object.create(n) : (t.prototype = n.prototype, 
            new t());
        };
    }();
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = n(5), s = function(e) {
        function r() {
            var r = e.call(this) || this;
            return r.middleware = {}, r;
        }
        return t(r, e), r.prototype.publish = function(e, r) {
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
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(0), o = function() {
        function e() {
            this.events = {};
        }
        return e.prototype.on = function(e, r) {
            return r && "function" == typeof r ? this.events[e] ? this.events[e].push(r) : void (this.events[e] = [ r ]) : t.logError("Listener must be a function");
        }, e.prototype.emit = function(e) {
            for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
            var t = this.events[e];
            if (t) {
                for (var o = 0, s = t.length; o < s; o++) (i = t[o]).call.apply(i, [ null ].concat(r));
                var i;
            }
        }, e.prototype.removeListener = function(e, r) {
            var n = this.events[e];
            if (n) for (var t = 0, o = n.length; t < o; t++) n[t] === r && this.events[e].splice(t, 1);
        }, e.prototype.removeEvent = function(e) {
            this.events[e] = null;
        }, e.prototype.removeEvents = function() {
            this.events = {};
        }, e;
    }();
    r.EventEmitter = o;
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(1), o = n(0), s = n(7), i = n(8), c = function() {
        function e(e) {
            if (!e.worker || "[object Function]" !== {}.toString.call(e.worker)) return o.logError("Worker must be provided and it must be a function \n \n");
            var r = {
                port: e.port || 80,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartWorkerOnFail: e.restartWorkerOnFail || !1,
                useBinary: e.useBinary || !1,
                machineScale: e.machineScale
            };
            t.isMaster ? s.masterProcess(r) : i.workerProcess(r);
        }
        return e;
    }();
    r.ClusterWS = c;
}, function(e, r, n) {
    "use strict";
    function t(e) {
        function r(t, i) {
            var a = o.fork();
            a.on("exit", function() {
                s.logWarning(t + " has been disconnected \n"), e.restartWorkerOnFail && (s.logWarning(t + " is restarting \n"), 
                r(t, i));
            }), a.on("message", function(e) {
                return "Ready" === e.event ? n(i, e.data, t) : "";
            }), a.send({
                event: t,
                data: {
                    internalKey: c,
                    index: i
                }
            });
        }
        function n(n, o, c) {
            if (t) return s.logReady(c + " has been restarted");
            if (-1 === n) return r("Broker", 0);
            if (0 === n) {
                for (var a = 1; a <= e.workers; a++) r("Worker", a);
                return i[n] = ">>> " + c + " on: " + e.brokerPort + ", PID " + o;
            }
            if (i[n] = "       " + c + ": " + n + ", PID " + o, Object.keys(i).length === e.workers + 1) {
                t = !0, s.logReady(">>> Master on: " + e.port + ", PID: " + process.pid);
                for (var u in i) i[u] && s.logReady(i[u]);
            }
        }
        var t = !1, i = {}, c = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        e.machineScale && e.machineScale.master ? r("Scaler", -1) : r("Broker", 0);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = n(1), s = n(0);
    r.masterProcess = t;
}, function(e, r, n) {
    "use strict";
    function t(e) {
        process.on("message", function(r) {
            switch (r.event) {
              case "Broker":
                return s.Broker.Server(e.brokerPort, {
                    key: r.data.internalKey,
                    machineScale: e.machineScale
                });

              case "Worker":
                return new i.Worker(e, r.data);

              case "Scaler":
                return e.machineScale ? s.Broker.Server(e.machineScale.port, {
                    key: e.machineScale.externalKey || ""
                }) : "";
            }
        }), process.on("uncaughtException", function(r) {
            if (o.logError("PID: " + process.pid + "\n" + r.stack + "\n"), e.restartWorkerOnFail) return process.exit();
        });
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = n(0), s = n(2), i = n(9);
    r.workerProcess = t;
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(3), o = n(2), s = n(10), i = n(4), c = n(11), a = function() {
        function e(e, r) {
            var n = this;
            this.options = e, this.httpServer = s.createServer(), this.socketServer = new i.SocketServer(), 
            o.Broker.Client("ws://127.0.0.1:" + e.brokerPort, r.internalKey, this.socketServer), 
            new t.Server({
                server: this.httpServer
            }).on("connection", function(e) {
                return n.socketServer.emit("connection", new c.Socket(e, n));
            }), this.httpServer.listen(this.options.port, function() {
                n.options.worker.call(n), process.send({
                    event: "Ready",
                    data: process.pid
                });
            });
        }
        return e;
    }();
    r.Worker = a;
}, function(e, r) {
    e.exports = require("http");
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(5), o = n(0), s = n(12), i = function() {
        function e(e, r) {
            var n = this;
            this.socket = e, this.server = r, this.channels = [], this.events = new t.EventEmitter(), 
            this.missedPing = 0;
            var i = function(e) {
                return -1 !== n.channels.indexOf(e.channel) ? n.send(e.channel, e.data, "publish") : "";
            };
            this.server.socketServer.on("#publish", i);
            var c = setInterval(function() {
                if (n.missedPing++ > 2) return n.disconnect(4001, "Did not get pongs");
                n.send("#0", null, "ping");
            }, this.server.options.pingInterval);
            this.send("configuration", {
                ping: this.server.options.pingInterval,
                binary: this.server.options.useBinary
            }, "system"), this.socket.on("error", function(e) {
                return n.events.emit("error", e);
            }), this.socket.on("message", function(e) {
                if (n.server.options.useBinary && "string" != typeof e && (e = Buffer.from(e).toString()), 
                "#1" === e) return n.missedPing = 0;
                try {
                    e = JSON.parse(e);
                } catch (e) {
                    return o.logError("PID: " + process.pid + "\n" + e + "\n");
                }
                s.socketDecodeMessages(n, e);
            }), this.socket.on("close", function(e, r) {
                clearInterval(c), n.events.emit("disconnect", e, r), n.server.socketServer.removeListener("#publish", i);
                for (var t in n) n.hasOwnProperty(t) && delete n[t];
            });
        }
        return e.prototype.on = function(e, r) {
            this.events.on(e, r);
        }, e.prototype.send = function(e, r, n) {
            if (this.server.options.useBinary && "configuration" !== e) return this.socket.send(Buffer.from(s.socketEncodeMessages(e, r, n || "emit")));
            this.socket.send(s.socketEncodeMessages(e, r, n || "emit"));
        }, e.prototype.disconnect = function(e, r) {
            this.socket.close(e, r);
        }, e;
    }();
    r.Socket = i;
}, function(e, r, n) {
    "use strict";
    function t(e, r, n) {
        switch (n) {
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
                var n = function() {
                    return -1 === e.channels.indexOf(r["#"][2]) ? e.channels.push(r["#"][2]) : "";
                };
                return e.server.socketServer.middleware.onSubscribe ? e.server.socketServer.middleware.onSubscribe(e, r["#"][2], function(e) {
                    return e ? "" : n();
                }) : n();

              case "u":
                var t = e.channels.indexOf(r["#"][2]);
                if (-1 !== t) return e.channels.splice(t, 1);
            }
        }
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.socketEncodeMessages = t, r.socketDecodeMessages = o;
} ]);