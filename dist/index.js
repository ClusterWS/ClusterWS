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
    }, r.p = "", r(r.s = 5);
}([ function(e, r, n) {
    "use strict";
    function t(e) {
        return void 0 === e && (e = !0), e ? Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) + "-" + Math.random().toString(16).substr(2) : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    function o(e) {
        return console.log("[31m%s[0m", e);
    }
    function s(e) {
        return console.log("[36m%s[0m", e);
    }
    function i(e) {
        return console.log("[33m%s[0m", e);
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    }), r.randomString = t, r.logError = o, r.logReady = s, r.logWarning = i;
}, function(e, r) {
    e.exports = require("cluster");
}, function(e, r) {
    e.exports = require("uws");
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
            if ("[object Function]" !== {}.toString.call(r)) return t.logError("Listener must be a function");
            this.events[e] ? this.events[e].push(r) : this.events[e] = [ r ];
        }, e.prototype.emit = function(e) {
            for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
            var t = this.events[e];
            if (t) {
                for (var o = 0, s = t.length; o < s; o++) (i = t[o]).call.apply(i, [ null ].concat(r));
                var i;
            }
        }, e.prototype.removeListener = function(e, r) {
            var n = this.events[e];
            if (n) for (var t = 0, o = n.length; t < o; t++) if (n[t] === r) return n.splice(t, 1);
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
    var t = n(2), o = n(0), s = function() {
        function e() {}
        return e.Client = function(r, n, s, i) {
            var c = new t(r);
            c.on("message", function(e) {
                return "#0" === e ? c.send("#1") : s.broadcastMessage("", e);
            }), c.on("open", function() {
                i && o.logReady("Socket has been reconnected"), c.send(n);
            }), c.on("error", function(t) {
                if ("uWs client connection error" === t.stack) return e.Client(r, n, s, !0);
                o.logError("Socket " + process.pid + " has an issue: \n" + t.stack + "\n");
            }), c.on("close", function(t, i) {
                if (4e3 === t) return o.logError("Wrong authorization key was provided");
                o.logWarning("Something went wrong, socket will be reconnected as soon as possible"), 
                e.Client(r, n, s, !0);
            }), s.setBroker(c);
        }, e.Server = function(r, n) {
            function s(e, r) {
                for (var n = 0, t = u.length; n < t; n++) u[n].id !== e && u[n].send(r);
            }
            function i(e) {
                if (e.id = o.randomString(!1), 0 === u.length) return u.push(e);
                for (var r = 0, n = u.length; r < n; r++) if (u[r].id === e.id) return i(e);
                u.push(e);
            }
            var c, u = [], a = new t.Server({
                port: r
            }, function() {
                return process.send({
                    event: "READY",
                    data: process.pid
                });
            });
            a.on("connection", function(e) {
                var r = !1, t = setTimeout(function() {
                    return e.close(4e3, "Not Authenticated");
                }, 5e3), o = setInterval(function() {
                    return e.send("#0");
                }, 2e4);
                e.on("message", function(o) {
                    if ("#1" !== o) return o === n.key ? (r = !0, i(e), clearTimeout(t)) : void (r && (s(e.id, o), 
                    n.machineScale && c.send(o)));
                }), e.on("close", function() {
                    if (clearTimeout(t), clearInterval(o), r) for (var n = 0, s = u.length; n < s; n++) if (u[n].id === e.id) return u.splice(n, 1);
                });
            }), a.on("error", function(e) {
                return o.logError("Broker " + process.pid + " has an issue: \n" + e.stack + "\n");
            }), function() {
                if (n.machineScale) {
                    var r = "ws://" + (n.machineScale.master ? "127.0.0.1:" : n.machineScale.url + ":") + n.machineScale.port;
                    e.Client(r, n.machineScale.securityKey || "", {
                        broadcastMessage: s,
                        setBroker: function(e) {
                            return c = e;
                        }
                    });
                }
            }();
        }, e;
    }();
    r.Broker = s;
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(1), o = n(6), s = n(7), i = n(0), c = function() {
        function e(e) {
            if ("[object Function]" !== {}.toString.call(e.worker)) return i.logError("Worker must be provided and it must be a function \n \n");
            var r = {
                port: e.port || (e.secureProtocolOptions ? 443 : 80),
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartWorkerOnFail: e.restartWorkerOnFail || !1,
                useBinary: e.useBinary || !1,
                secureProtocolOptions: e.secureProtocolOptions || !1,
                machineScale: e.machineScale || !1
            };
            t.isMaster ? o.masterProcess(r) : s.workerProcess(r);
        }
        return e;
    }();
    r.ClusterWS = c;
}, function(e, r, n) {
    "use strict";
    function t(e) {
        function r(t, c) {
            var u = o.fork();
            u.send({
                event: t,
                data: {
                    internalKey: i,
                    id: c
                }
            }), u.on("message", function(e) {
                return "READY" === e.event ? n(c, e.data, t) : "";
            }), u.on("exit", function() {
                s.logWarning(t + " has been disconnected \n"), e.restartWorkerOnFail && (s.logWarning(t + " is restarting \n"), 
                r(t, c));
            });
        }
        function n(n, o, i) {
            if (t) return s.logReady(i + " is restarted");
            if (-1 === n) return r("Broker", 0);
            if (0 === n) {
                for (var u = 1; u <= e.workers; u++) r("Worker", u);
                return c[n] = ">>> " + i + " on: " + e.brokerPort + ", PID " + o;
            }
            if (c[n] = "       " + i + ": " + n + ", PID " + o, Object.keys(c).length === e.workers + 1) {
                t = !0, s.logReady(">>> Master on: " + e.port + ", PID: " + process.pid + (e.secureProtocolOptions ? " (secure)" : ""));
                for (var a in c) c[a] && s.logReady(c[a]);
            }
        }
        var t = !1, i = s.randomString(), c = {};
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
              case "Worker":
                return new o.Worker(e, r.data);

              case "Broker":
                return s.Broker.Server(e.brokerPort, {
                    key: r.data.internalKey,
                    machineScale: e.machineScale
                });

              case "Scaler":
                return e.machineScale ? s.Broker.Server(e.machineScale.port, {
                    key: e.machineScale.securityKey || ""
                }) : null;
            }
        }), process.on("uncaughtException", function(e) {
            return i.logError("PID: " + process.pid + "\n" + e.stack + "\n"), process.exit();
        });
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = n(8), s = n(4), i = n(0);
    r.workerProcess = t;
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(9), o = n(10), s = n(2), i = n(11), c = n(4), u = n(12), a = function() {
        function e(e, r) {
            var n = this;
            this.options = e, this.socketServer = new u.SocketServer(), c.Broker.Client("ws://127.0.0.1:" + e.brokerPort, r.internalKey, this.socketServer), 
            this.options.secureProtocolOptions;
            var a = this.options.secureProtocolOptions ? o.createServer(this.options.secureProtocolOptions) : t.createServer();
            new s.Server({
                server: a,
                verifyClient: function(e, r) {
                    return n.socketServer.middleware.verifyConnection ? n.socketServer.middleware.verifyConnection.call(null, e, r) : r(!0);
                }
            }).on("connection", function(e) {
                return n.socketServer.emit("connection", new i.Socket(e, n));
            }), a instanceof o.Server ? this.httpsServer = a : this.httpServer = a, a.listen(this.options.port, function() {
                n.options.worker.call(n), process.send({
                    event: "READY",
                    data: process.pid
                });
            });
        }
        return e;
    }();
    r.Worker = a;
}, function(e, r) {
    e.exports = require("http");
}, function(e, r) {
    e.exports = require("https");
}, function(e, r, n) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var t = n(3), o = n(0), s = function() {
        function e(r, n) {
            var s = this;
            this.socket = r, this.server = n, this.missedPing = 0, this.channels = [], this.events = new t.EventEmitter();
            var i = function(e) {
                return -1 !== s.channels.indexOf(e.channel) ? s.send(e.channel, e.data, "publish") : null;
            }, c = setInterval(function() {
                return s.missedPing++ > 2 ? s.disconnect(4001, "No pongs") : s.send("#0", null, "ping");
            }, this.server.options.pingInterval);
            this.server.socketServer.on("#publish", i), this.send("configuration", {
                ping: this.server.options.pingInterval,
                binary: this.server.options.useBinary
            }, "system"), this.socket.on("error", function(e) {
                return s.events.emit("error", e);
            }), this.socket.on("close", function(e, r) {
                clearInterval(c), s.events.emit("disconnect", e, r), s.server.socketServer.removeListener("#publish", i);
                for (var n in s) s[n] && (s[n] = null);
            }), this.socket.on("message", function(r) {
                if (s.server.options.useBinary && "string" != typeof r && (r = Buffer.from(r).toString()), 
                "#1" === r) return s.missedPing = 0;
                try {
                    r = JSON.parse(r);
                } catch (e) {
                    return o.logError("PID: " + process.pid + "\n" + e + "\n");
                }
                e.decode(s, r);
            });
        }
        return e.decode = function(e, r) {
            switch (r["#"][0]) {
              case "e":
                return e.events.emit(r["#"][1], r["#"][2]);

              case "p":
                return -1 !== e.channels.indexOf(r["#"][1]) ? e.server.socketServer.publish(r["#"][1], r["#"][2]) : null;

              case "s":
                switch (r["#"][1]) {
                  case "s":
                    var n = function() {
                        return -1 === e.channels.indexOf(r["#"][2]) ? e.channels.push(r["#"][2]) : null;
                    };
                    return e.server.socketServer.middleware.onsubscribe ? e.server.socketServer.middleware.onsubscribe(e, r["#"][2], function(e) {
                        return e ? n() : null;
                    }) : n();

                  case "u":
                    var t = e.channels.indexOf(r["#"][2]);
                    return -1 !== t ? e.channels.splice(t, 1) : null;
                }
            }
        }, e.encode = function(e, r, n) {
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
        }, e.prototype.send = function(r, n, t) {
            void 0 === t && (t = "emit"), this.socket.send(this.server.options.useBinary ? Buffer.from(e.encode(r, n, t)) : e.encode(r, n, t));
        }, e.prototype.on = function(e, r) {
            this.events.on(e, r);
        }, e.prototype.disconnect = function(e, r) {
            this.socket.close(e, r);
        }, e;
    }();
    r.Socket = s;
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
    var o = n(3), s = function(e) {
        function r() {
            var r = null !== e && e.apply(this, arguments) || this;
            return r.middleware = {}, r;
        }
        return t(r, e), r.prototype.setMiddleware = function(e, r) {
            this.middleware[e] = r;
        }, r.prototype.publish = function(e, r) {
            this.brokerSocket.send(Buffer.from(JSON.stringify({
                channel: e,
                data: r
            }))), this.emit("#publish", {
                channel: e,
                data: r
            });
        }, r.prototype.setBroker = function(e) {
            this.brokerSocket = e;
        }, r.prototype.broadcastMessage = function(e, r) {
            this.emit("#publish", JSON.parse(Buffer.from(r).toString()));
        }, r;
    }(o.EventEmitter);
    r.SocketServer = s;
} ]);