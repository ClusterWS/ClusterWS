"use strict";

var crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster"), extendStatics = Object.setPrototypeOf || {
    __proto__: []
} instanceof Array && function(e, r) {
    e.__proto__ = r;
} || function(e, r) {
    for (var n in r) r.hasOwnProperty(n) && (e[n] = r[n]);
};

function __extends(e, r) {
    function n() {
        this.constructor = e;
    }
    extendStatics(e, r), e.prototype = null === r ? Object.create(r) : (n.prototype = r.prototype, 
    new n());
}

var noop = function() {}, native = function() {
    try {
        return require("./node/uws_" + process.platform + "_" + process.versions.modules);
    } catch (n) {
        var e = process.version.substring(1).split(".").map(function(e) {
            return parseInt(e, 10);
        }), r = e[0] < 6 || 6 === e[0] && e[1] < 4;
        if ("win32" === process.platform && r) throw new Error("µWebSockets requires Node.js 6.4.0 or greater on Windows.");
        throw new Error("Could not run µWebSockets bindings");
    }
}(), OPCODE_TEXT = 1, OPCODE_PING = 9, OPCODE_BINARY = 2, DEFAULT_PAYLOAD_LIMIT = 16777216;

native.setNoop(noop);

var clientGroup = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT);

native.client.group.onConnection(clientGroup, function(e) {
    var r = native.getUserData(e);
    r.external = e, r.internalOnOpen();
}), native.client.group.onMessage(clientGroup, function(e, r) {
    return r.internalOnMessage(e);
}), native.client.group.onPing(clientGroup, function(e, r) {
    return r.onping(e);
}), native.client.group.onPong(clientGroup, function(e, r) {
    return r.onpong(e);
}), native.client.group.onError(clientGroup, function(e) {
    return process.nextTick(function() {
        return e.internalOnError({
            message: "uWs client connection error",
            stack: "uWs client connection error"
        });
    });
}), native.client.group.onDisconnection(clientGroup, function(e, r, n, t) {
    t.external = null, process.nextTick(function() {
        return t.internalOnClose(r, n);
    }), native.clearUserData(e);
});

var WebSocket = function() {
    function e(e, r, n) {
        void 0 === r && (r = null), void 0 === n && (n = !1);
        var t = this;
        this.OPEN = 1, this.CLOSED = 0, this.onping = noop, this.onpong = noop, this.isAlive = !0, 
        this.external = noop, this.internalOnOpen = noop, this.internalOnError = noop, this.internalOnClose = noop, 
        this.internalOnMessage = noop, this.external = r, this.executeOn = n ? "server" : "client", 
        this.onpong = function() {
            return t.isAlive = !0;
        }, !n && native.connect(clientGroup, e, this);
    }
    return Object.defineProperty(e.prototype, "readyState", {
        get: function() {
            return this.external ? this.OPEN : this.CLOSED;
        },
        enumerable: !0,
        configurable: !0
    }), e.prototype.on = function(e, r) {
        var n = this;
        return {
            ping: function() {
                return n.onping = r;
            },
            pong: function() {
                return n.onpong = r;
            },
            open: function() {
                return n.internalOnOpen = r;
            },
            error: function() {
                return n.internalOnError = r;
            },
            close: function() {
                return n.internalOnClose = r;
            },
            message: function() {
                return n.internalOnMessage = r;
            }
        }[e](), this;
    }, e.prototype.ping = function(e) {
        this.external && native[this.executeOn].send(this.external, e, OPCODE_PING);
    }, e.prototype.send = function(e, r) {
        if (this.external) {
            var n = r && r.binary || "string" != typeof e;
            native[this.executeOn].send(this.external, e, n ? OPCODE_BINARY : OPCODE_TEXT, void 0);
        }
    }, e.prototype.terminate = function() {
        this.external && (native[this.executeOn].terminate(this.external), this.external = null);
    }, e.prototype.close = function(e, r) {
        this.external && (native[this.executeOn].close(this.external, e, r), this.external = null);
    }, e;
}();

function logError(e) {
    return console.log("[31m" + e + "[0m");
}

function logReady(e) {
    return console.log("[36m" + e + "[0m");
}

function logWarning(e) {
    return console.log("[33m" + e + "[0m");
}

function generateKey(e) {
    return crypto.randomBytes(Math.ceil(e / 2)).toString("hex").slice(0, e);
}

var EventEmitterSingle = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.on = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] = r;
    }, e.prototype.emit = function(e) {
        for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
        var t = this.events[e];
        t && t.apply(void 0, r);
    }, e.prototype.removeEvents = function() {
        this.events = {};
    }, e;
}(), PERMESSAGE_DEFLATE = 1, DEFAULT_PAYLOAD_LIMIT$1 = 16777216, APP_PING_CODE = Buffer.from("9"), APP_PONG_CODE = 65;

native.setNoop(noop);

var WebSocketServer = function(e) {
    function r(r, n) {
        var t = e.call(this) || this;
        if (t.upgradeReq = null, t.upgradeCallback = noop, t.lastUpgradeListener = !0, !r || !r.port && !r.server && !r.noServer) throw new TypeError("Wrong options");
        t.noDelay = r.noDelay || !0, t.passedHttpServer = r.server;
        var o = r.perMessageDeflate ? PERMESSAGE_DEFLATE : 0;
        return t.serverGroup = native.server.group.create(o, r.maxPayload || DEFAULT_PAYLOAD_LIMIT$1), 
        t.httpServer = r.server || HTTP.createServer(function(e, r) {
            return r.end();
        }), !r.path || r.path.length && "/" === r.path[0] || (r.path = "/" + r.path), t.httpServer.on("upgrade", function(e, n, o) {
            if (r.path && r.path !== e.url.split("?")[0].split("#")[0]) t.lastUpgradeListener && t.abortConnection(n, 400, "URL not supported"); else if (r.verifyClient) {
                var s = {
                    origin: e.headers.origin,
                    secure: !(!e.connection.authorized && !e.connection.encrypted),
                    req: e
                };
                r.verifyClient(s, function(r, s, i) {
                    return r ? t.handleUpgrade(e, n, o, t.emitConnection) : t.abortConnection(n, s, i);
                });
            } else t.handleUpgrade(e, n, o, t.emitConnection);
        }), t.httpServer.on("error", function(e) {
            return t.emit("error", e);
        }), t.httpServer.on("newListener", function(e, r) {
            return "upgrade" === e ? t.lastUpgradeListener = !1 : null;
        }), native.server.group.onConnection(t.serverGroup, function(e) {
            var r = new WebSocket(null, e, !0);
            native.setUserData(e, r), t.upgradeCallback(r), t.upgradeReq = null;
        }), native.server.group.onMessage(t.serverGroup, function(e, r) {
            if (t.pingIsAppLevel && ("string" != typeof e && (e = Buffer.from(e)), e[0] === APP_PONG_CODE)) return r.isAlive = !0;
            r.internalOnMessage(e);
        }), native.server.group.onDisconnection(t.serverGroup, function(e, r, n, t) {
            t.external = null, process.nextTick(function() {
                return t.internalOnClose(r, n);
            }), native.clearUserData(e);
        }), native.server.group.onPing(t.serverGroup, function(e, r) {
            return r.onping(e);
        }), native.server.group.onPong(t.serverGroup, function(e, r) {
            return r.onpong(e);
        }), r.port && t.httpServer.listen(r.port, r.host || null, function() {
            t.emit("listening"), n && n();
        }), t;
    }
    return __extends(r, e), r.prototype.keepAlive = function(e, r) {
        var n = this;
        void 0 === r && (r = !1), r && (this.pingIsAppLevel = !0), setTimeout(function() {
            native.server.group.forEach(n.serverGroup, n.pingIsAppLevel ? n.sendPingsAppLevel : n.sendPings), 
            n.keepAlive(e);
        }, e);
    }, r.prototype.sendPings = function(e) {
        e.isAlive ? (e.isAlive = !1, e.ping()) : e.terminate();
    }, r.prototype.sendPingsAppLevel = function(e) {
        e.isAlive ? (e.isAlive = !1, e.send(APP_PING_CODE)) : e.terminate();
    }, r.prototype.emitConnection = function(e) {
        this.emit("connection", e);
    }, r.prototype.abortConnection = function(e, r, n) {
        e.end("HTTP/1.1 " + r + " " + n + "\r\n\r\n");
    }, r.prototype.handleUpgrade = function(e, r, n, t) {
        var o = this;
        if (r._isNative) this.serverGroup && (this.upgradeReq = e, this.upgradeCallback = t || noop, 
        native.upgrade(this.serverGroup, r.external, null, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"])); else {
            var s = e.headers["sec-websocket-key"], i = r.ssl ? r._parent._handle : r._handle, a = r.ssl ? r.ssl._external : null;
            if (i && s && 24 === s.length) {
                r.setNoDelay(this.noDelay);
                var c = native.transfer(-1 === i.fd ? i : i.fd, a);
                r.on("close", function(r) {
                    o.serverGroup && (o.upgradeReq = e, o.upgradeCallback = t || noop, native.upgrade(o.serverGroup, c, s, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"]));
                });
            }
            r.destroy();
        }
    }, r;
}(EventEmitterSingle);

function encode(e, r, n) {
    var t = {
        emit: {
            "#": [ "e", e, r ]
        },
        publish: {
            "#": [ "p", e, r ]
        },
        system: {
            subscribe: {
                "#": [ "s", "s", r ]
            },
            unsubscribe: {
                "#": [ "s", "u", r ]
            },
            configuration: {
                "#": [ "s", "c", r ]
            }
        }
    };
    return JSON.stringify("system" === n ? t[n][e] : t[n]);
}

function decode(e, r) {
    var n = {
        e: function() {
            return e.events.emit(r["#"][1], r["#"][2]);
        },
        p: function() {
            return e.channels[r["#"][1]] && e.worker.wss.publish(r["#"][1], r["#"][2]);
        },
        s: {
            s: function() {
                var n = function() {
                    e.channels[r["#"][2]] = 1, e.worker.wss.channels.onMany(r["#"][2], e.onPublishEvent);
                };
                e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe(e, r["#"][2], function(e) {
                    return e && n();
                }) : n();
            },
            u: function() {
                e.worker.wss.channels.removeListener(r["#"][2], e.onPublishEvent), e.channels[r["#"][2]] = null;
            }
        }
    };
    return "s" === r["#"][0] ? n[r["#"][0]][r["#"][1]] && n[r["#"][0]][r["#"][1]]() : n[r["#"][0]] && n[r["#"][0]]();
}

var Socket = function() {
    function e(e, r) {
        var n = this;
        this.events = new EventEmitterSingle(), this.channels = {}, this.worker = e, this.socket = r, 
        this.onPublishEvent = function(e, r) {
            return n.send(e, r, "publish");
        }, this.send("configuration", {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        }, "system"), this.socket.on("error", function(e) {
            return n.events.emit("error", e);
        }), this.socket.on("message", function(e) {
            try {
                e = JSON.parse(e), decode(n, e);
            } catch (e) {
                return logError("PID: " + process.pid + "\n" + e + "\n");
            }
        }), this.socket.on("close", function(e, r) {
            n.events.emit("disconnect", e, r);
            for (var t = 0, o = (s = Object.keys(n.channels)).length; t < o; t++) n.worker.wss.channels.removeListener(s[t], n.onPublishEvent);
            var s;
            for (t = 0, o = (s = Object.keys(n)).length; t < o; t++) n[s[t]] = null;
        });
    }
    return e.prototype.on = function(e, r) {
        this.events.on(e, r);
    }, e.prototype.send = function(e, r, n) {
        void 0 === n && (n = "emit"), this.socket.send(this.worker.options.useBinary ? Buffer.from(encode(e, r, n)) : encode(e, r, n));
    }, e.prototype.disconnect = function(e, r) {
        this.socket.close(e, r);
    }, e.prototype.terminate = function() {
        this.socket.terminate();
    }, e;
}(), EventEmitterMany = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.onMany = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push(r) : this.events[e] = [ r ];
    }, e.prototype.emitMany = function(e) {
        for (var r = [], n = 1; n < arguments.length; n++) r[n - 1] = arguments[n];
        var t = this.events[e];
        if (t) for (var o = 0, s = t.length; o < s; o++) t[o].apply(t, [ e ].concat(r));
    }, e.prototype.removeListener = function(e, r) {
        var n = this.events[e];
        if (n) {
            for (var t = 0, o = n.length; t < o; t++) if (n[t] === r) return n.splice(t, 1);
            0 === n.length && (this.events[e] = null);
        }
    }, e.prototype.exist = function(e) {
        return this.events[e] && this.events[e].length > 0;
    }, e;
}(), WSServer = function(e) {
    function r() {
        var r = null !== e && e.apply(this, arguments) || this;
        return r.channels = new EventEmitterMany(), r.middleware = {}, r.internalBrokers = {
            brokers: {},
            nextBroker: -1,
            brokersKeys: [],
            brokersAmount: 0
        }, r;
    }
    return __extends(r, e), r.prototype.setMiddleware = function(e, r) {
        this.middleware[e] = r;
    }, r.prototype.publishToWorkers = function(e) {
        this.publish("#sendToWorkers", e);
    }, r.prototype.publish = function(e, r, n) {
        var t = this;
        if (void 0 === n && (n = 0), n > 2 * this.internalBrokers.brokersAmount + 10) return logWarning("Does not have access to any broker");
        if (this.internalBrokers.brokersAmount <= 0) return setTimeout(function() {
            return t.publish(e, r, ++n);
        }, 10);
        this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++;
        var o = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]];
        return 1 !== o.readyState ? (delete this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]], 
        this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), this.internalBrokers.brokersAmount--, 
        this.publish(e, r, ++n)) : (o.send(Buffer.from(e + "%" + JSON.stringify({
            message: r
        }))), "#sendToWorkers" === e ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(r) : (this.middleware.onPublish && this.middleware.onPublish(e, r), 
        void this.channels.emitMany(e, r)));
    }, r.prototype.broadcastMessage = function(e, r) {
        var n = (r = Buffer.from(r)).indexOf(37), t = r.slice(0, n).toString();
        if ("#sendToWorkers" === t) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(JSON.parse(r.slice(n + 1)).message);
        if (this.channels.exist(t)) {
            var o = JSON.parse(r.slice(n + 1)).message;
            this.middleware.onPublish && this.middleware.onPublish(t, o), this.channels.emitMany(t, o);
        }
    }, r.prototype.setBroker = function(e, r) {
        this.internalBrokers.brokers[r] = e, this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;
    }, r;
}(EventEmitterSingle);

function BrokerClient(e, r, n, t, o) {
    void 0 === t && (t = 0);
    var s = new WebSocket(e);
    s.on("open", function() {
        t = 0, n.setBroker(s, e), o && logReady("Broker has been connected to " + e + " \n"), 
        s.send(r);
    }), s.on("error", function(i) {
        if (s = void 0, "uWs client connection error" === i.stack) return 5 === t && logWarning("Can not connect to the Broker " + e + ". System in reconnection state please check your Broker and URL \n"), 
        setTimeout(function() {
            return BrokerClient(e, r, n, ++t, o || t > 5);
        }, 500);
        logError("Socket " + process.pid + " has an issue: \n " + i.stack + " \n");
    }), s.on("close", function(o) {
        if (s = void 0, 4e3 === o) return logError("Can not connect to the broker wrong authorization key \n");
        logWarning("Broker has disconnected, system is trying to reconnect to " + e + " \n"), 
        setTimeout(function() {
            return BrokerClient(e, r, n, ++t, !0);
        }, 500);
    }), s.on("message", function(e) {
        return n.broadcastMessage("", e);
    });
}

var Worker = function() {
    return function(e, r) {
        var n = this;
        this.wss = new WSServer(), this.options = e;
        for (var t = 0; t < this.options.brokers; t++) BrokerClient("ws://127.0.0.1:" + this.options.brokersPorts[t], r, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        var o = new WebSocketServer({
            server: this.server,
            verifyClient: function(e, r) {
                return n.wss.middleware.verifyConnection ? n.wss.middleware.verifyConnection(e, r) : r(!0);
            }
        });
        o.on("connection", function(e) {
            return n.wss.emit("connection", new Socket(n, e));
        }), o.keepAlive(this.options.pingInterval, !0), this.server.listen(this.options.port, this.options.host, function() {
            n.options.worker.call(n), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    };
}();

function BrokerServer(e, r, n, t) {
    var o, s = {}, i = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === t && n && n.masterOptions && n.masterOptions.tlsOptions) {
        var a = HTTPS.createServer(n.masterOptions.tlsOptions);
        o = new WebSocketServer({
            server: a
        }), a.listen(e, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else o = new WebSocketServer({
        port: e
    }, function() {
        return process.send({
            event: "READY",
            pid: process.pid
        });
    });
    function c(e, r) {
        for (var n = 0, t = Object.keys(s), o = t.length; n < o; n++) t[n] !== e && s[t[n]] && s[t[n]].send(r);
    }
    function u(e, r) {
        void 0 === r && (r = ""), BrokerClient(e, r, {
            broadcastMessage: c,
            setBroker: function(e, r) {
                i.brokers[r] = e, i.brokersKeys = Object.keys(i.brokers), i.brokersAmount = i.brokersKeys.length;
            }
        });
    }
    o.on("connection", function(e) {
        e.isAuth = !1, e.authTimeOut = setTimeout(function() {
            return e.close(4e3, "Not Authenticated");
        }, 5e3), e.on("message", function(o) {
            if (o === r) {
                if (e.isAuth) return;
                return e.isAuth = !0, function e(r) {
                    r.id = generateKey(16);
                    if (s[r.id]) return e(r);
                    s[r.id] = r;
                }(e), clearTimeout(e.authTimeOut);
            }
            e.isAuth && (c(e.id, o), "Scaler" !== t && n && function e(r) {
                if (i.brokersAmount <= 0) return;
                i.nextBroker >= i.brokersAmount - 1 ? i.nextBroker = 0 : i.nextBroker++;
                var n = i.brokers[i.brokersKeys[i.nextBroker]];
                if (1 !== n.readyState) return delete i.brokers[i.brokersKeys[i.nextBroker]], i.brokersKeys = Object.keys(i.brokers), 
                i.brokersAmount--, e(r);
                n.send(r);
            }(o));
        }), e.on("close", function(r, n) {
            clearTimeout(e.authTimeOut), e.isAuth && (s[e.id] = null), e = void 0;
        });
    }), o.keepAlive(2e4), function() {
        if ("Scaler" === t || !n) return;
        n.masterOptions && u((n.masterOptions.tlsOptions ? "wss" : "ws") + "://127.0.0.1:" + n.masterOptions.port, n.key);
        for (var e = 0, r = n.brokersUrls.length; e < r; e++) u(n.brokersUrls[e], n.key);
    }();
}

var ClusterWS = function() {
    function e(e) {
        if ("[object Function]" !== {}.toString.call(e.worker)) return logError("Worker param must be provided and it must be a function \n");
        var r = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            host: e.host || null,
            worker: e.worker,
            workers: e.workers || 1,
            brokers: e.brokers || 1,
            useBinary: e.useBinary || !1,
            brokersPorts: e.brokersPorts || [],
            tlsOptions: e.tlsOptions || !1,
            pingInterval: e.pingInterval || 2e4,
            restartWorkerOnFail: e.restartWorkerOnFail || !1,
            horizontalScaleOptions: e.horizontalScaleOptions || !1
        };
        if (!e.brokersPorts) for (var n = 0; n < r.brokers; n++) r.brokersPorts.push(n + 9400);
        if (r.brokersPorts.length < r.brokers) return logError("Number of the broker ports can not be less than number of brokers \n");
        cluster.isMaster ? this.masterProcess(r) : this.workerProcess(r);
    }
    return e.prototype.masterProcess = function(e) {
        var r = !1, n = generateKey(16), t = {}, o = {};
        if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (var s = 0; s < e.brokers; s++) i("Broker", s);
        function i(s, a) {
            var c = cluster.fork();
            c.on("message", function(n) {
                return "READY" === n.event && function(n, s, a) {
                    if (r) return logReady(n + " PID " + a + " has been restarted");
                    "Worker" === n && (o[s] = "\tWorker: " + s + ", PID " + a);
                    if ("Scaler" === n) for (var c = 0; c < e.brokers; c++) i("Broker", c);
                    if ("Broker" === n && (t[s] = ">>>  Broker on: " + e.brokersPorts[s] + ", PID " + a, 
                    Object.keys(t).length === e.brokers)) for (var c = 0; c < e.workers; c++) i("Worker", c);
                    Object.keys(t).length === e.brokers && Object.keys(o).length === e.workers && (r = !0, 
                    logReady(">>>  Master on: " + e.port + ", PID: " + process.pid + " " + (e.tlsOptions ? " (secure)" : "")), 
                    Object.keys(t).forEach(function(e) {
                        return t.hasOwnProperty(e) && logReady(t[e]);
                    }), Object.keys(o).forEach(function(e) {
                        return o.hasOwnProperty(e) && logReady(o[e]);
                    }));
                }(s, a, n.pid);
            }), c.on("exit", function() {
                logError(s + " has exited \n"), e.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
                i(s, a)), c = void 0;
            }), c.send({
                securityKey: n,
                processId: a,
                processName: s
            });
        }
    }, e.prototype.workerProcess = function(e) {
        process.on("message", function(r) {
            var n = {
                Worker: function() {
                    return new Worker(e, r.securityKey);
                },
                Broker: function() {
                    return BrokerServer(e.brokersPorts[r.processId], r.securityKey, e.horizontalScaleOptions, "Broker");
                },
                Scaler: function() {
                    return e.horizontalScaleOptions && BrokerServer(e.horizontalScaleOptions.masterOptions.port, e.horizontalScaleOptions.key || "", e.horizontalScaleOptions, "Scaler");
                }
            };
            n[r.processName] && n[r.processName]();
        }), process.on("uncaughtException", function(e) {
            return logError("PID: " + process.pid + "\n " + e.stack + "\n"), process.exit();
        });
    }, e;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
