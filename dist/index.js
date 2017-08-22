module.exports = function(e) {
    function t(r) {
        if (n[r]) return n[r].exports;
        var o = n[r] = {
            i: r,
            l: !1,
            exports: {}
        };
        return e[r].call(o.exports, o, o.exports, t), o.l = !0, o.exports;
    }
    var n = {};
    return t.m = e, t.c = n, t.d = function(e, n, r) {
        t.o(e, n) || Object.defineProperty(e, n, {
            configurable: !1,
            enumerable: !0,
            get: r
        });
    }, t.n = function(e) {
        var n = e && e.__esModule ? function() {
            return e.default;
        } : function() {
            return e;
        };
        return t.d(n, "a", n), n;
    }, t.o = function(e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
    }, t.p = "", t(t.s = 7);
}([ function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    }), t.count = function(e) {
        for (var t = 0, n = 0, r = e.length; n < r; n++) e[n] && t++;
        return t;
    }, t.logError = function(e) {
        return console.log("[31m%s[0m", e);
    }, t.logDebug = function(e) {
        return process.env.DEBUG ? console.log("DEBUG: ", e) : "";
    }, t.logRunning = function(e) {
        return console.log("[36m%s[0m", e);
    };
}, function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = function(e) {
        return function t() {
            for (var n = [], r = 0; r < arguments.length; r++) n[r] = arguments[r];
            return n.length < e.length ? function() {
                for (var e = [], r = 0; r < arguments.length; r++) e[r] = arguments[r];
                return t.call.apply(t, [ null ].concat(n, e));
            } : e.length ? e.call.apply(e, [ null ].concat(n)) : e;
        };
    }, o = function(e) {
        return e ? "function" == typeof e ? e() : e : "";
    }, s = r(function(e, t) {
        return o(t in e ? e[t] : e.default);
    }), i = function(e, t) {
        for (var n = -1, r = null == t ? 0 : t.length, o = new Array(r); ++n < r; ) o[n] = e(t[n], n, t);
        return o;
    }, c = function(e, t) {
        var n = {};
        return t = Object(t), Object.keys(t).forEach(function(r) {
            return n[r] = e(t[r], r, t);
        }), n;
    }, u = r(function(e, t) {
        return t instanceof Array ? i(e, t) : c(e, t);
    });
    t._ = {
        map: u,
        curry: r,
        switchcase: s
    };
}, function(e, t, n) {
    "use strict";
    function r(e, t) {
        return {
            type: e,
            data: t
        };
    }
    function o(e, t, n) {
        return i._.switchcase({
            ping: e,
            publish: JSON.stringify({
                m: [ "p", e, t ]
            }),
            emit: JSON.stringify({
                m: [ "e", e, t ]
            }),
            system: i._.switchcase({
                subsribe: JSON.stringify({
                    m: [ "s", "s", t ]
                }),
                unsubscribe: JSON.stringify({
                    m: [ "s", "u", t ]
                }),
                configuration: JSON.stringify({
                    m: [ "s", "c", t ]
                })
            })(e)
        })(n);
    }
    function s(e, t) {
        return JSON.stringify({
            channel: e,
            data: t
        });
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var i = n(1);
    t.processMessages = r, t.socketMessages = o, t.brokerMessage = s;
}, function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = n(1), o = n(0), s = function() {
        function e() {
            this._events = {};
        }
        return e.prototype.on = function(e, t) {
            t && "function" == typeof t || o.logError("Listener must be a function"), this._events[e] ? this._events[e].push(t) : this._events[e] = [ t ];
        }, e.prototype.emit = function(e) {
            for (var t = [], n = 1; n < arguments.length; n++) t[n - 1] = arguments[n];
            r._.map(function(e) {
                return e.call.apply(e, [ null ].concat(t));
            }, this._events[e]);
        }, e.prototype.removeListener = function(e, t) {
            var n = this;
            r._.map(function(r, o) {
                return r === t ? n._events[e].splice(o, 1) : "";
            }, this._events[e]);
        }, e.prototype.removeEvent = function(e) {
            this._events[e] = null;
        }, e.prototype.removeAllEvents = function() {
            this._events = {};
        }, e.prototype.exist = function(e) {
            return this._events[e];
        }, e;
    }();
    t.EventEmitter = s;
}, function(e, t) {
    e.exports = require("cluster");
}, function(e, t, n) {
    "use strict";
    var r = this && this.__extends || function() {
        var e = Object.setPrototypeOf || {
            __proto__: []
        } instanceof Array && function(e, t) {
            e.__proto__ = t;
        } || function(e, t) {
            for (var n in t) t.hasOwnProperty(n) && (e[n] = t[n]);
        };
        return function(t, n) {
            function r() {
                this.constructor = t;
            }
            e(t, n), t.prototype = null === n ? Object.create(n) : (r.prototype = n.prototype, 
            new r());
        };
    }();
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = n(3), s = n(6), i = function(e) {
        function t(t, n) {
            var r = e.call(this) || this;
            return r.port = t, r.buffer = "", t instanceof s.Socket ? r.socket = t : r.socket = s.connect(t, n), 
            r.socket.on("end", function() {
                return r.emit("disconnect");
            }), r.socket.on("error", function(e) {
                return r.emit("error", e);
            }), r.socket.on("connect", function() {
                return r.emit("connect");
            }), r.socket.on("data", function(e) {
                var t = e.toString(), n = t.indexOf("\n");
                if (-1 === n) return r.buffer += t;
                r.emit("message", r.buffer + t.slice(0, n));
                for (var o = n + 1; -1 !== (n = t.indexOf("\n", o)); ) r.emit("message", t.slice(o, n)), 
                o = n + 1;
                r.buffer = t.slice(o);
            }), r;
        }
        return r(t, e), t.prototype.send = function(e) {
            this.socket.write(e + "\n");
        }, t;
    }(o.EventEmitter);
    t.TcpSocket = i;
}, function(e, t) {
    e.exports = require("net");
}, function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = n(8), o = n(4), s = n(9), i = n(10), c = function() {
        function e(t) {
            if (!e.instance) {
                e.instance = this;
                var n = new r.Options(t || {});
                o.isMaster ? s.processMaster(n) : i.processWorker(n);
            }
        }
        return e;
    }();
    t.ClusterWS = c;
}, function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = n(0), o = function() {
        function e(e) {
            if (!e.worker) throw r.logError("Worker must be provided");
            this.port = e.port || 80, this.worker = e.worker, this.workers = e.workers || 1, 
            this.brokerPort = e.brokerPort || 9346, this.pingInterval = e.pingInterval || 2e4, 
            this.restartOnFail = e.restartOnFail || !1;
        }
        return e;
    }();
    t.Options = o;
}, function(e, t, n) {
    "use strict";
    function r(e) {
        var t = [];
        c.logRunning(">>> Master on: " + e.port + ", PID " + process.pid);
        var n = function(n, r) {
            t[n] = 0 === n ? ">>> Broker on: " + e.brokerPort + ", PID " + r : "       Worker: " + n + ", PID " + r, 
            c.count(t) === e.workers + 1 && s._.map(function(e) {
                return c.logRunning(e);
            }, t);
        }, r = function(t, c) {
            var u = o.fork();
            u.on("message", function(e) {
                return s._.switchcase({
                    ready: function() {
                        return n(c, e.data);
                    }
                })(e.type);
            }), u.on("exit", function() {
                return e.restartOnFail ? r(t, c) : "";
            }), u.send(i.processMessages(t, c));
        };
        r("broker", 0);
        for (var u = 1; u <= e.workers; u++) r("worker", u);
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = n(4), s = n(1), i = n(2), c = n(0);
    t.processMaster = r;
}, function(e, t, n) {
    "use strict";
    function r(e) {
        process.on("message", function(t) {
            return o._.switchcase({
                worker: function() {
                    return new s.Worker(e, t.data);
                },
                broker: function() {
                    return new i.Broker(e, t.data);
                }
            })(t.type);
        }), process.on("uncaughtException", function(e) {
            return c.logError("PID: " + process.pid + "\n" + e.stack + "\n");
        });
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var o = n(1), s = n(11), i = n(15), c = n(0);
    t.processWorker = r;
}, function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = n(12), o = n(13), s = n(0), i = n(5), c = n(14), u = n(3), a = n(2), f = function() {
        function e(e, t) {
            var n = this;
            this.options = e, this.id = t, this.socketServer = {};
            var f = new i.TcpSocket(this.options.brokerPort, "127.0.0.1");
            f.on("error", function(e) {
                return s.logError("Worker, PID " + process.pid + "\n" + e.stack + "\n");
            }), f.on("message", function(e) {
                return "#0" === e ? f.send("#1") : n.socketServer.emitter.emit("#publish", JSON.parse(e));
            }), f.on("disconnect", function() {
                return s.logError("Something went wrong broker has been disconnected");
            }), this.socketServer.emitter = new u.EventEmitter(), this.socketServer.on = function(e, t) {
                return n.socketServer.emitter.on(e, t);
            }, this.socketServer.publish = function(e, t) {
                f.send(a.brokerMessage(e, t)), n.socketServer.emitter.emit("#publish", {
                    channel: e,
                    data: t
                });
            }, this.httpServer = c.createServer().listen(this.options.port), new r.Server({
                server: this.httpServer
            }).on("connection", function(e) {
                return n.socketServer.emitter.emit("connection", new o.Socket(e, n));
            }), this.options.worker.call(this), process.send(a.processMessages("ready", process.pid));
        }
        return e;
    }();
    t.Worker = f;
}, function(e, t) {
    e.exports = require("uws");
}, function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = n(1), o = n(3), s = n(2), i = function() {
        function e(e, t) {
            var n = this;
            this.socket = e, this.channels = [], this.events = new o.EventEmitter();
            var s = function(e) {
                return -1 !== n.channels.indexOf(e.channel) ? n.send(e.channel, e.data, "publish") : "";
            };
            t.socketServer.emitter.on("#publish", s);
            var i = 0, c = setInterval(function() {
                return i++ > 2 ? n.disconnect(3001, "No pongs from socket") : n.send("#0", null, "ping");
            }, t.options.pingInterval);
            this.send("configuration", {
                ping: t.options.pingInterval
            }, "system"), this.socket.on("error", function(e) {
                return n.events.emit("error", e);
            }), this.socket.on("close", function(e, r) {
                n.events.emit("disconnect", e, r), clearInterval(c), n.events.removeAllEvents(), 
                t.socketServer.emitter.removeListener("#publish", s);
                for (var o in n) n.hasOwnProperty(o) && (n[o] = null, delete n[o]);
            }), this.socket.on("message", function(e) {
                if ("#1" === e) return i = 0;
                e = JSON.parse(e), r._.switchcase({
                    p: function() {
                        return -1 !== n.channels.indexOf(e.m[1]) ? t.socketServer.publish(e.m[1], e.m[2]) : "";
                    },
                    e: function() {
                        return n.events.emit(e.m[1], e.m[2]);
                    },
                    s: function() {
                        return r._.switchcase({
                            s: function() {
                                return -1 === n.channels.indexOf(e.m[2]) ? n.channels.push(e.m[2]) : "";
                            },
                            u: function() {
                                return -1 !== n.channels.indexOf(e.m[2]) ? n.channels.splice(n.channels.indexOf(e.m[2]), 1) : "";
                            }
                        })(e.m[1]);
                    }
                })(e.m[0]);
            });
        }
        return e.prototype.on = function(e, t) {
            this.events.on(e, t);
        }, e.prototype.send = function(e, t, n) {
            this.socket.send(s.socketMessages(e, t, n || "emit"));
        }, e.prototype.disconnect = function(e, t) {
            this.socket.close(e, t);
        }, e;
    }();
    t.Socket = i;
}, function(e, t) {
    e.exports = require("http");
}, function(e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    var r = n(1), o = n(0), s = n(5), i = n(6), c = n(2), u = function() {
        function e(e, t) {
            var n = this;
            this.options = e, this.id = t, this.servers = [];
            i.createServer(function(e) {
                var t = n.servers.length, r = new s.TcpSocket(e);
                setInterval(function() {
                    return r.send("#0");
                }, 2e4);
                n.servers[t] = r, r.on("error", function(e) {
                    return o.logError("Broker, PID " + process.pid + "\n" + e.stack + "\n");
                }), r.on("message", function(e) {
                    return "#1" !== e ? n.broadcast(t, e) : "";
                }), r.on("disconnect", function() {
                    return o.logError("Server " + t + " has disconnected");
                });
            }).listen(e.brokerPort);
            process.send(c.processMessages("ready", process.pid));
        }
        return e.prototype.broadcast = function(e, t) {
            r._.map(function(n, r) {
                return r !== e ? n.send(t) : "";
            }, this.servers);
        }, e;
    }();
    t.Broker = u;
} ]);