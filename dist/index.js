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
    }, t.p = "", t(t.s = 6);
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
}, function(e, t, r) {
    "use strict";
    function n(e, t) {
        return {
            event: e,
            data: t
        };
    }
    function o(e, t) {
        return JSON.stringify({
            channel: e,
            data: t
        });
    }
    function s(e, t, r) {
        switch (r) {
          case "ping":
            return e;

          case "emit":
            return JSON.stringify({
                "#": [ "e", e, t ]
            });

          case "publish":
            return JSON.stringify({
                "#": [ "p", e, t ]
            });

          case "system":
            switch (e) {
              case "subsribe":
                return JSON.stringify({
                    "#": [ "s", "s", t ]
                });

              case "unsubscribe":
                return JSON.stringify({
                    "#": [ "s", "u", t ]
                });

              case "configuration":
                return JSON.stringify({
                    "#": [ "s", "c", t ]
                });
            }
        }
    }
    function i(e, t) {
        switch (t["#"][0]) {
          case "e":
            return e.events.emit(t["#"][1], t["#"][2]);

          case "p":
            return -1 !== e.channels.indexOf(t["#"][1]) ? e.server.socketServer.publish(t["#"][1], t["#"][2]) : "";

          case "s":
            switch (t["#"][1]) {
              case "s":
                var r = function() {
                    return -1 === e.channels.indexOf(t["#"][2]) ? e.channels.push(t["#"][2]) : "";
                };
                return e.server.socketServer.middleware.onSubscribe ? e.server.socketServer.middleware.onSubscribe(e, t["#"][2], function(e) {
                    return e ? "" : r();
                }) : r();

              case "u":
                var n = e.channels.indexOf(t["#"][2]);
                if (-1 !== n) return e.channels.splice(n, 1);
            }
        }
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    }), t.processMessage = n, t.brokerMessage = o, t.socketEncodeMessages = s, t.socketDecodeMessages = i;
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
                for (var o = 0, s = n.length; o < s; o++) (i = n[o]).call.apply(i, [ null ].concat(t));
                var i;
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
}, function(e, t) {
    e.exports = require("cluster");
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
    var o = r(2), s = r(5), i = function(e) {
        function t(t, r) {
            var n = e.call(this) || this;
            return n.socketOrPort = t, n.host = r, n.backlog = [], n.isSocket = n.socketOrPort instanceof s.Socket, 
            n.create(), n;
        }
        return n(t, e), t.prototype.create = function() {
            var e = this;
            this.socket = this.isSocket ? this.socketOrPort : s.connect(this.socketOrPort, this.host), 
            this.socket.setKeepAlive(!0, 15e3), this.socket.on("end", function() {
                return e.emit("end");
            }), this.socket.on("error", function(t) {
                return e.emit("error", t);
            }), this.socket.on("close", function() {
                e.emit("disconnect"), e.reconnect();
            }), this.socket.on("timeout", function() {
                e.emit("timeout"), e.reconnect();
            }), this.socket.on("connect", function() {
                return e.connect();
            });
            var t = "";
            this.socket.on("data", function(r) {
                var n, o = 0;
                for (r = r.toString("utf8"); (n = r.indexOf("\n", o)) > -1; ) t += r.substring(o, n), 
                e.emit("message", t), t = "", o = n + 1;
                t += r.substring(o);
            });
        }, t.prototype.connect = function() {
            if (this.emit("connect"), this.backlog.length > 0) {
                var e = Array.prototype.slice.call(this.backlog);
                this.backlog = [];
                for (var t = 0, r = e.length; r > t; t++) this.socket.write(e[t]);
            }
        }, t.prototype.send = function(e) {
            if (this.socket.writable) return this.socket.write(e + "\n");
            this.backlog.push(e + "\n");
        }, t.prototype.reconnect = function() {
            var e = this;
            this.isSocket || setTimeout(function() {
                return e.create();
            }, Math.floor(10 * Math.random()) + 3);
        }, t;
    }(o.EventEmitter);
    t.TcpSocket = i;
}, function(e, t) {
    e.exports = require("net");
}, function(e, t, r) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var n = r(3), o = r(7), s = r(13), i = r(0), c = function() {
        function e(e) {
            if (!e.worker) return void i.logError("Worker must be provided");
            var t = {
                port: e.port || 80,
                worker: e.worker,
                workers: e.workers || 1,
                brokerPort: e.brokerPort || 9346,
                pingInterval: e.pingInterval || 2e4,
                restartOnFail: e.restartOnFail || !1
            };
            n.isMaster ? s.processMaster(t) : o.processWorker(t);
        }
        return e;
    }();
    t.ClusterWS = c;
}, function(e, t, r) {
    "use strict";
    function n(e) {
        process.on("message", function(t) {
            switch (t.event) {
              case "initWorker":
                return new o.Worker(e, t.data);

              case "initBroker":
                return new s.Broker(e, t.data);
            }
        }), process.on("uncaughtException", function(e) {
            return i.logError("PID: " + process.pid + "\n" + e.stack + "\n");
        });
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = r(8), s = r(12), i = r(0);
    t.processWorker = n;
}, function(e, t, r) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var n = r(9), o = r(10), s = r(0), i = r(4), c = r(11), u = r(2), a = r(1), f = function() {
        function e(e, t) {
            var r = this;
            this.options = e, this.id = t;
            var f = new i.TcpSocket(this.options.brokerPort, "127.0.0.1");
            f.on("error", function(e) {
                return s.logError("Worker, PID " + process.pid + "\n" + e.stack + "\n");
            }), f.on("message", function(e) {
                return "#0" === e ? f.send("#1") : r.socketServer.emitter.emit("#publish", JSON.parse(e));
            }), f.on("disconnect", function() {
                return s.logError("Something went wrong, broker has been disconnected");
            }), this.socketServer = {
                middleware: {},
                emitter: new u.EventEmitter(),
                on: function(e, t) {
                    return r.socketServer.emitter.on(e, t);
                },
                publish: function(e, t) {
                    f.send(a.brokerMessage(e, t)), r.socketServer.emitter.emit("#publish", {
                        channel: e,
                        data: t
                    });
                }
            }, this.httpServer = c.createServer().listen(this.options.port, function() {
                new n.Server({
                    server: r.httpServer
                }).on("connection", function(e) {
                    return r.socketServer.emitter.emit("connection", new o.Socket(e, r));
                }), r.options.worker.call(r), process.send(a.processMessage("ready", process.pid));
            });
        }
        return e;
    }();
    t.Worker = f;
}, function(e, t) {
    e.exports = require("uws");
}, function(e, t, r) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var n = r(0), o = r(2), s = r(1), i = function() {
        function e(e, t) {
            var r = this;
            this.socket = e, this.server = t;
            var i = function(e) {
                return -1 !== r.channels.indexOf(e.channel) ? r.send(e.channel, e.data, "publish") : "";
            };
            this.server.socketServer.emitter.on("#publish", i);
            var c = 0, u = setInterval(function() {
                if (c++ > 2) return r.disconnect(4001, "Did not get pongs");
                r.send("#0", null, "ping");
            }, this.server.options.pingInterval);
            this.send("configuration", {
                ping: t.options.pingInterval
            }, "system"), this.events = new o.EventEmitter(), this.channels = [], this.socket.on("message", function(e) {
                if ("#1" === e) return c = 0;
                try {
                    e = JSON.parse(e);
                } catch (e) {
                    return n.logError("PID: " + process.pid + "\n" + e + "\n");
                }
                s.socketDecodeMessages(r, e);
            }), this.socket.on("error", function(e) {
                return r.events.emit("error", e);
            }), this.socket.on("close", function(e, t) {
                clearInterval(u), r.events.emit("disconnect", e, t), r.server.socketServer.emitter.removeListener("#publish", i);
                for (var n in r) r.hasOwnProperty(n) && delete r[n];
            });
        }
        return e.prototype.on = function(e, t) {
            this.events.on(e, t);
        }, e.prototype.send = function(e, t, r) {
            this.socket.send(s.socketEncodeMessages(e, t, r || "emit"));
        }, e.prototype.disconnect = function(e, t) {
            this.socket.close(e, t);
        }, e;
    }();
    t.Socket = i;
}, function(e, t) {
    e.exports = require("http");
}, function(e, t, r) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var n = r(0), o = r(4), s = r(5), i = r(1), c = function() {
        function e(e, t) {
            var r = this;
            this.options = e, this.id = t, this.servers = [], s.createServer(function(e) {
                var t = new o.TcpSocket(e), s = r.servers.length;
                r.servers[s] = t, setInterval(function() {
                    return t.send("#0");
                }, 2e4), t.on("error", function(e) {
                    return n.logError("Broker, PID " + process.pid + "\n" + e.stack + "\n");
                }), t.on("message", function(e) {
                    return "#1" !== e ? r.broadcast(s, e) : "";
                }), t.on("disconnect", function() {
                    return n.logError("Server " + s + " has disconnected");
                });
            }).listen(e.brokerPort, function() {
                process.send(i.processMessage("ready", process.pid));
            });
        }
        return e.prototype.broadcast = function(e, t) {
            for (var r = 0, n = this.servers.length; r < n; r++) r !== e && this.servers[r].send(t);
        }, e;
    }();
    t.Broker = c;
}, function(e, t, r) {
    "use strict";
    function n(e) {
        var t = 0, r = [], n = function(t, r) {
            var o = i.fork();
            o.on("message", function(e) {
                return "ready" === e.event ? c(r, e.data) : "";
            }), o.on("exit", function() {
                return e.restartOnFail ? n(t, r) : "";
            }), o.send(s.processMessage(t, r));
        }, c = function(s, i) {
            if (0 === s ? function() {
                for (var t = 1; t <= e.workers; t++) n("initWorker", t);
                r[s] = ">>> Broker on: " + e.brokerPort + ", PID " + i;
            }() : r[s] = "       Worker: " + s + ", PID " + i, t++ >= e.workers) {
                o.logReady(">>> Master on: " + e.port + ", PID " + process.pid);
                for (var c in r) o.logReady(r[c]);
            }
        };
        n("initBroker", 0);
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = r(0), s = r(1), i = r(3);
    t.processMaster = n;
} ]);