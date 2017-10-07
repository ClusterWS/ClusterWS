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
    function s(e, r, t) {
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
    function i(e, r) {
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
    }), r.processMessage = n, r.brokerMessage = o, r.socketEncodeMessages = s, r.socketDecodeMessages = i;
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
    var o = t(2), s = t(5), i = function(e) {
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
}, function(e, r) {
    e.exports = require("net");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(3), o = t(7), s = t(13), i = t(0), c = function() {
        function e(e) {
            if (!e.worker) return void i.logError("Worker must be provided");
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
    r.ClusterWS = c;
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
    var o = t(8), s = t(12), i = t(0);
    r.processWorker = n;
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(9), o = t(10), s = t(0), i = t(4), c = t(11), u = t(2), a = t(1), f = function() {
        function e(e, r) {
            var t = this;
            this.options = e, this.id = r;
            var f = new i.TcpSocket(this.options.brokerPort, "127.0.0.1");
            f.on("error", function(e) {
                return s.logError("Worker, PID " + process.pid + "\n" + e.stack + "\n");
            }), f.on("message", function(e) {
                return "#0" === e ? f.send("#1") : t.socketServer.emitter.emit("#publish", JSON.parse(e));
            }), f.on("disconnect", function() {
                return s.logError("Something went wrong, broker has been disconnected");
            }), this.socketServer = {
                middleware: {},
                emitter: new u.EventEmitter(),
                on: function(e, r) {
                    return t.socketServer.emitter.on(e, r);
                },
                publish: function(e, r) {
                    f.send(a.brokerMessage(e, r)), t.socketServer.emitter.emit("#publish", {
                        channel: e,
                        data: r
                    });
                }
            }, this.httpServer = c.createServer().listen(this.options.port), new n.Server({
                server: this.httpServer
            }).on("connection", function(e) {
                return t.socketServer.emitter.emit("connection", new o.Socket(e, t));
            }), this.options.worker.call(this), process.send(a.processMessage("ready", process.pid));
        }
        return e;
    }();
    r.Worker = f;
}, function(e, r) {
    e.exports = require("uws");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(0), o = t(2), s = t(1), i = function() {
        function e(e, r) {
            var t = this;
            this.socket = e, this.server = r;
            var i = function(e) {
                return -1 !== t.channels.indexOf(e.channel) ? t.send(e.channel, e.data, "publish") : "";
            };
            this.server.socketServer.emitter.on("#publish", i);
            var c = 0, u = setInterval(function() {
                if (c++ > 2) return t.disconnect(3001, "Did not get pongs");
                t.send("#0", null, "ping");
            }, this.server.options.pingInterval);
            this.send("configuration", {
                ping: r.options.pingInterval
            }, "system"), this.events = new o.EventEmitter(), this.channels = [], this.socket.on("message", function(e) {
                if ("#1" === e) return c = 0;
                console.log(e);
                try {
                    e = JSON.parse(e);
                } catch (e) {
                    return n.logError("PID: " + process.pid + "\n" + e + "\n");
                }
                s.socketDecodeMessages(t, e);
            }), this.socket.on("error", function(e) {
                return t.events.emit("error", e);
            }), this.socket.on("close", function(e, r) {
                clearInterval(u), t.events.emit("disconnect", e, r), t.server.socketServer.emitter.removeListener("#publish", i);
                for (var n in t) t.hasOwnProperty(n) && delete t[n];
            });
        }
        return e.prototype.on = function(e, r) {
            this.events.on(e, r);
        }, e.prototype.send = function(e, r, t) {
            this.socket.send(s.socketEncodeMessages(e, r, t || "emit"));
        }, e.prototype.disconnect = function(e, r) {
            this.socket.close(e, r);
        }, e;
    }();
    r.Socket = i;
}, function(e, r) {
    e.exports = require("http");
}, function(e, r, t) {
    "use strict";
    Object.defineProperty(r, "__esModule", {
        value: !0
    });
    var n = t(0), o = t(4), s = t(5), i = t(1), c = function() {
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
    var o = t(0), s = t(1), i = t(3);
    r.processMaster = n;
} ]);