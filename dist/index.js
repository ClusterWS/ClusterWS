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
    }), r.randomString = n, r.logError = o, r.logReady = s, r.logWarning = i;
}, function(e, r) {
    e.exports = require("cluster");
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
            if ("[object Function]" !== {}.toString.call(r)) return n.logError("Listener must be a function");
            this.events[e] ? "verifyConnection" === e ? this.events[e][0] = r : this.events[e].push(r) : this.events[e] = [ r ];
        }, e.prototype.emit = function(e) {
            for (var r = [], t = 1; t < arguments.length; t++) r[t - 1] = arguments[t];
            var n = this.events[e];
            if (n) {
                for (var o = 0, s = n.length; o < s; o++) (i = n[o]).call.apply(i, [ null ].concat(r));
                var i;
            }
        }, e.prototype.removeListener = function(e, r) {
            var t = this.events[e];
            if (t) for (var n = 0, o = t.length; n < o; n++) if (t[n] === r) return t.splice(n, 1);
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
    var n = t(2), o = t(0), s = function() {
        function e() {}
        return e.Client = function(r, t, s, i) {
            var c = new n(r);
            c.on("message", function(e) {
                return "#0" === e ? c.send("#1") : s.broadcastMessage("", e);
            }), c.on("open", function() {
                i && o.logReady("Socket has been reconnected"), c.send(t);
            }), c.on("error", function(n) {
                if ("uWs client connection error" === n.stack) return e.Client(r, t, s, !0);
                o.logError("Socket " + process.pid + " has an issue: \n" + n.stack + "\n");
            }), c.on("close", function(n, i) {
                if (4e3 === n) return o.logError("Wrong or no authenticated key was provided");
                o.logWarning("Something went wrong, socket will be reconnected as soon as possible"), 
                e.Client(r, t, s, !0);
            }), s.setBroker(c);
        }, e.Server = function(r, t) {
            function s(e, r) {
                for (var t = 0, n = u.length; t < n; t++) u[t].id !== e && u[t].send(r);
            }
            function i(e) {
                if (e.id = o.randomString(!1), u.length) return u.push(e);
                for (var r = 0, t = u.length; r < t; r++) if (u[r].id === e.id) return i(e);
                u.push(e);
            }
            var c, u = [], a = new n.Server({
                port: r
            }, function() {
                return process.send({
                    event: "READY",
                    data: process.pid
                });
            });
            a.on("connection", function(e) {
                var r = !1, n = setTimeout(function() {
                    return e.close(4e3, "Not Authenticated");
                }, 5e3), o = setInterval(function() {
                    return e.send("#0");
                }, 2e4);
                e.on("message", function(o) {
                    if ("#1" !== o) return o === t.key ? (r = !0, i(e), clearTimeout(n)) : void (r && (s(e.id, o), 
                    t.machineScale && c.send(o)));
                }), e.on("close", function() {
                    if (clearTimeout(n), clearInterval(o), r) for (var t = 0, s = u.length; t < s; t++) if (u[t].id === e.id) return u.splice(t, 1);
                });
            }), a.on("error", function(e) {
                return o.logError("Broker " + process.pid + " has an issue: \n" + e.stack + "\n");
            }), function() {
                if (t.machineScale) {
                    var r = t.machineScale.master ? "127.0.0.1:" : t.machineScale.url + ":";
                    e.Client("ws://" + r + t.machineScale.port, t.machineScale.securityKey || "", {
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
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(1), o = t(6), s = t(7), i = t(0), c = function() {
        function e(e) {
            if ("[object Function]" !== {}.toString.call(e.worker)) return i.logError("Worker must be provided and it must be a function \n \n");
            var r = e.secureProtocolOptions ? 443 : 80, t = {
                port: e.port || r,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartWorkerOnFail: e.restartWorkerOnFail || !1,
                useBinary: e.useBinary || !1,
                secureProtocolOptions: !!e.secureProtocolOptions && {
                    key: e.secureProtocolOptions.key,
                    cert: e.secureProtocolOptions.cert,
                    ca: e.secureProtocolOptions.ca
                },
                machineScale: e.machineScale
            };
            n.isMaster ? o.masterProcess(t) : s.workerProcess(t);
        }
        return e;
    }();
    r.ClusterWS = c;
}, function(e, r, t) {
    "use strict";
    function n(e) {
        function r(n, c) {
            var u = o.fork();
            u.send({
                event: n,
                data: {
                    internalKey: i,
                    id: c
                }
            }), u.on("message", function(e) {
                return "READY" === e.event ? t(c, e.data, n) : "";
            }), u.on("exit", function() {
                s.logWarning(n + " has been disconnected \n"), e.restartWorkerOnFail && (s.logWarning(n + " is restarting \n"), 
                r(n, c));
            });
        }
        function t(t, o, i) {
            if (n) return s.logReady(i + " is restarted");
            if (-1 === t) return r("Broker", 0);
            if (0 === t) {
                for (var u = 1; u <= e.workers; u++) r("Worker", u);
                return c[t] = ">>> " + i + " on: " + e.brokerPort + ", PID " + o;
            }
            if (0 !== t && (c[t] = "       " + i + ": " + t + ", PID " + o), Object.keys(c).length === e.workers + 1) {
                n = !0;
                var a = e.secureProtocolOptions ? " (secure)" : "";
                s.logReady(">>> Master on: " + e.port + ", PID: " + process.pid + a);
                for (var l in c) c[l] && s.logReady(c[l]);
            }
        }
        var n = !1, i = s.randomString(), c = {};
        e.machineScale && e.machineScale.master ? r("Scaler", -1) : r("Broker", 0);
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
                }) : "";
            }
        }), process.on("uncaughtException", function(e) {
            return i.logError("PID: " + process.pid + "\n" + e.stack + "\n"), process.exit();
        });
    }
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var o = t(8), s = t(4), i = t(0);
    r.workerProcess = n;
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(2), o = t(9), s = t(10), i = t(4), c = t(11), u = t(12), a = function() {
        function e(e, r) {
            var t = this;
            this.options = e, this.socketServer = new c.SocketServer(), i.Broker.Client("ws://127.0.0.1:" + e.brokerPort, r.internalKey, this.socketServer), 
            this.options.secureProtocolOptions;
            var a = this.options.secureProtocolOptions ? o.createServer({
                key: this.options.secureProtocolOptions.key,
                cert: this.options.secureProtocolOptions.cert,
                ca: this.options.secureProtocolOptions.ca
            }) : u.createServer();
            new n.Server({
                server: a,
                verifyClient: function(e, r) {
                    return t.socketServer.emit("verifyConnection", e, r);
                }
            }).on("connection", function(e) {
                return t.socketServer.emit("connection", new s.Socket(e, t));
            }), this.socketServer.on("verifyConnection", function(e, r) {
                return r(!0);
            }), this.options.secureProtocolOptions ? this.httpsServer = a : this.httpServer = a, 
            a.listen(this.options.port, function() {
                t.options.worker.call(t), process.send({
                    event: "READY",
                    data: process.pid
                });
            });
        }
        return e;
    }();
    r.Worker = a;
}, function(e, r) {
    e.exports = require("https");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(3), o = t(0), s = function() {
        function e(r, t) {
            var s = this;
            this.socket = r, this.server = t, this.missedPing = 0, this.channels = [], this.events = new n.EventEmitter();
            var i = function(e) {
                return -1 !== s.channels.indexOf(e.channel) ? s.send(e.channel, e.data, "publish") : "";
            };
            this.server.socketServer.on("#publish", i);
            var c = setInterval(function() {
                return s.missedPing++ > 2 ? s.disconnect(4001, "No pongs") : s.send("#0", null, "ping");
            }, this.server.options.pingInterval);
            this.send("configuration", {
                ping: this.server.options.pingInterval,
                binary: this.server.options.useBinary
            }, "system"), this.socket.on("error", function(e) {
                return s.events.emit("error", e);
            }), this.socket.on("close", function(e, r) {
                clearInterval(c), s.events.emit("disconnect", e, r), s.server.socketServer.removeListener("#publish", i);
                for (var t in s) s.hasOwnProperty(t) && delete s[t];
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
                return -1 !== e.channels.indexOf(r["#"][1]) ? e.server.socketServer.publish(r["#"][1], r["#"][2]) : "";

              case "s":
                switch (r["#"][1]) {
                  case "s":
                    var t = function() {
                        return -1 === e.channels.indexOf(r["#"][2]) ? e.channels.push(r["#"][2]) : "";
                    };
                    return e.server.socketServer.middleware.onsubscribe ? e.server.socketServer.middleware.onsubscribe(e, r["#"][2], function(e) {
                        return e ? t() : "";
                    }) : t();

                  case "u":
                    var n = e.channels.indexOf(r["#"][2]);
                    return -1 !== n ? e.channels.splice(n, 1) : "";
                }
            }
        }, e.encode = function(e, r, t) {
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
        }, e.prototype.send = function(r, t, n) {
            void 0 === n && (n = "emit"), this.socket.send(this.server.options.useBinary && "configuration" !== r ? Buffer.from(e.encode(r, t, n)) : e.encode(r, t, n));
        }, e.prototype.on = function(e, r) {
            this.events.on(e, r);
        }, e.prototype.disconnect = function(e, r) {
            this.socket.close(e, r);
        }, e;
    }();
    r.Socket = s;
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
    var o = t(3), s = function(e) {
        function r() {
            var r = null !== e && e.apply(this, arguments) || this;
            return r.middleware = {}, r;
        }
        return n(r, e), r.prototype.setMiddleware = function(e, r) {
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
}, function(e, r) {
    e.exports = require("http");
} ]);