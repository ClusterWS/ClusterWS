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
}(), noop = function() {}, OPEN = 1, CLOSED = 0, OPCODE_TEXT = 1, OPCODE_PING = 9, OPCODE_BINARY = 2, PERMESSAGE_DEFLATE = 1, DEFAULT_PAYLOAD_LIMIT = 16777216, native = function() {
    try {
        return require("./node/uws_" + process.platform + "_" + process.versions.modules);
    } catch (n) {
        var e = process.version.substring(1).split(".").map(function(e) {
            return parseInt(e, 10);
        }), r = e[0] < 6 || 6 === e[0] && e[1] < 4;
        if ("win32" === process.platform && r) throw new Error("µWebSockets requires Node.js 6.4.0 or greater on Windows.");
    }
}();

native.setNoop(noop);

var WebSocket = function() {
    function e(e, r, n) {
        void 0 === r && (r = null), void 0 === n && (n = "client"), this.onping = noop, 
        this.onpong = noop, this.clientGroup = noop, this.external = noop, this.internalOnOpen = noop, 
        this.internalOnError = noop, this.internalOnClose = noop, this.internalOnMessage = noop, 
        this.websocketType = n, this.external = r, "client" === this.websocketType && (this.clientGroup = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT), 
        native.connect(this.clientGroup, e, this), native.client.group.onConnection(this.clientGroup, function(e) {
            var r = native.getUserData(e);
            r.external = e, r.internalOnOpen();
        }), native.client.group.onMessage(this.clientGroup, function(e, r) {
            r.internalOnMessage(e);
        }), native.client.group.onPing(this.clientGroup, function(e, r) {
            return r.onping(e);
        }), native.client.group.onPong(this.clientGroup, function(e, r) {
            return r.onpong(e);
        }), native.client.group.onError(this.clientGroup, function(e) {
            process.nextTick(function() {
                return e.internalOnError({
                    message: "uWs client connection error",
                    stack: "uWs client connection error"
                });
            });
        }), native.client.group.onDisconnection(this.clientGroup, function(e, r, n, t) {
            t.external = null, process.nextTick(function() {
                return t.internalOnClose(r, n);
            }), native.clearUserData(e);
        }));
    }
    return e.prototype.on = function(e, r) {
        var n = this, t = {
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
        };
        return t[e] && t[e](), this;
    }, e.prototype.ping = function(e) {
        this.external && ("client" === this.websocketType ? native.client.send(this.external, e, OPCODE_PING) : native.server.send(this.external, e, OPCODE_PING));
    }, e.prototype.terminate = function() {
        this.external && ("client" === this.websocketType ? native.client.terminate(this.external) : native.server.terminate(this.external), 
        this.external = null);
    }, e.prototype.close = function(e, r) {
        this.external && ("client" === this.websocketType ? native.client.close(this.external, e, r) : native.server.close(this.external, e, r), 
        this.external = null);
    }, e.prototype.send = function(e, r, n) {
        if (this.external) {
            "function" == typeof r && (n = r, r = null);
            var t = r && r.binary || "string" != typeof e;
            "client" === this.websocketType ? native.client.send(this.external, e, t ? OPCODE_BINARY : OPCODE_TEXT, n ? function() {
                return process.nextTick(n);
            } : void 0) : native.server.send(this.external, e, t ? OPCODE_BINARY : OPCODE_TEXT, n ? function() {
                return process.nextTick(n);
            } : void 0);
        } else n && n(new Error("Not opened"));
    }, Object.defineProperty(e.prototype, "OPEN", {
        get: function() {
            return OPEN;
        },
        enumerable: !0,
        configurable: !0
    }), Object.defineProperty(e.prototype, "CLOSED", {
        get: function() {
            return CLOSED;
        },
        enumerable: !0,
        configurable: !0
    }), Object.defineProperty(e.prototype, "readyState", {
        get: function() {
            return this.external ? OPEN : CLOSED;
        },
        enumerable: !0,
        configurable: !0
    }), e;
}(), WebSocketServer = function(e) {
    function r(r, n) {
        var t = e.call(this) || this;
        if (t.upgradeReq = null, t.upgradeCallback = noop, t.upgradeListener = null, t.lastUpgradeListener = !0, 
        !r || !r.port && !r.server && !r.noServer) throw new TypeError("Wrong options");
        t.noDelay = r.noDelay || !0, t.passedHttpServer = r.server;
        var o = !1 === r.perMessageDeflate ? 0 : PERMESSAGE_DEFLATE;
        return t.serverGroup = native.server.group.create(o, r.maxPayload || DEFAULT_PAYLOAD_LIMIT), 
        t.httpServer = r.server || HTTP.createServer(function(e, r) {
            return r.end();
        }), !r.path || r.path.length && "/" === r.path[0] || (r.path = "/" + r.path), t.httpServer.on("upgrade", t.upgradeListener = function(e, n, o) {
            if (r.path && r.path !== e.url.split("?")[0].split("#")[0]) t.lastUpgradeListener && t.abortConnection(n, 400, "URL not supported"); else if (r.verifyClient) {
                var s = {
                    origin: e.headers.origin,
                    secure: !(!e.connection.authorized && !e.connection.encrypted),
                    req: e
                };
                2 === r.verifyClient.length ? r.verifyClient(s, function(r, s, i) {
                    return r ? t.handleUpgrade(e, n, o, t.emitConnection) : t.abortConnection(n, s, i);
                }) : r.verifyClient(s) ? t.handleUpgrade(e, n, o, t.emitConnection) : t.abortConnection(n, 400, "Client verification failed");
            } else t.handleUpgrade(e, n, o, t.emitConnection);
        }), t.httpServer.on("error", function(e) {
            return t.emit("error", e);
        }), t.httpServer.on("newListener", function(e, r) {
            return "upgrade" === e ? t.lastUpgradeListener = !1 : null;
        }), native.server.group.onConnection(t.serverGroup, function(e) {
            var r = new WebSocket(null, e, "server");
            native.setUserData(e, r), t.upgradeCallback(r), t.upgradeReq = null;
        }), native.server.group.onMessage(t.serverGroup, t.sendMessage), native.server.group.onDisconnection(t.serverGroup, t.onDisconnection), 
        native.server.group.onPing(t.serverGroup, function(e, r) {
            return r.onping(e);
        }), native.server.group.onPong(t.serverGroup, function(e, r) {
            return r.onpong(e);
        }), r.port && t.httpServer.listen(r.port, r.host || null, function() {
            t.emit("listening"), n && n();
        }), t;
    }
    return __extends(r, e), r.prototype.close = function(e) {
        this.upgradeListener && this.httpServer && (this.httpServer.removeListener("upgrade", this.upgradeListener), 
        this.passedHttpServer || this.httpServer.close()), this.serverGroup && (native.server.group.close(this.serverGroup), 
        this.serverGroup = null), "function" == typeof e && setTimeout(e, 2e4);
    }, r.prototype.emitConnection = function(e) {
        this.emit("connection", e);
    }, r.prototype.abortConnection = function(e, r, n) {
        e.end("HTTP/1.1 " + r + " " + n + "\r\n\r\n");
    }, r.prototype.sendMessage = function(e, r) {
        r.internalOnMessage(e);
    }, r.prototype.onDisconnection = function(e, r, n, t) {
        t.external = null, process.nextTick(function() {
            return t.internalOnClose(r, n);
        }), native.clearUserData(e);
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
    return "ping" === n ? e : JSON.stringify("system" === n ? t[n][e] : t[n]);
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
                    e.channels[r["#"][2]] = 1, e.worker.wss.channels.onMany(r["#"][2], e.onPublish);
                };
                e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe(e, r["#"][2], function(e) {
                    return e && n();
                }) : n();
            },
            u: function() {
                e.worker.wss.channels.removeListener(r["#"][2], e.onPublish), e.channels[r["#"][2]] = null;
            }
        }
    };
    return "s" === r["#"][0] ? n[r["#"][0]][r["#"][1]] && n[r["#"][0]][r["#"][1]]() : n[r["#"][0]] && n[r["#"][0]]();
}

var Socket = function() {
    function e(e, r) {
        var n = this;
        this.events = new EventEmitterSingle(), this.channels = {}, this.missedPing = 0, 
        this.worker = e, this.socket = r, this.onPublish = function(e, r) {
            return n.send(e, r, "publish");
        };
        var t = setInterval(function() {
            return n.missedPing++ > 2 ? n.disconnect(4001, "No pongs") : n.send("#0", null, "ping");
        }, this.worker.options.pingInterval);
        this.send("configuration", {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        }, "system"), this.socket.on("error", function(e) {
            return n.events.emit("error", e);
        }), this.socket.on("message", function(e) {
            if ("string" != typeof e && (e = Buffer.from(e).toString()), "#1" === e) return n.missedPing = 0;
            try {
                e = JSON.parse(e);
            } catch (e) {
                return logError("PID: " + process.pid + "\n" + e + "\n");
            }
            decode(n, e);
        }), this.socket.on("close", function(e, r) {
            clearInterval(t), n.events.emit("disconnect", e, r);
            for (var o = 0, s = (i = Object.keys(n.channels)).length; o < s; o++) n.worker.wss.channels.removeListener(i[o], n.onPublish);
            var i;
            for (o = 0, s = (i = Object.keys(n)).length; o < s; o++) n[i[o]] = null;
        });
    }
    return e.prototype.on = function(e, r) {
        this.events.on(e, r);
    }, e.prototype.send = function(e, r, n) {
        void 0 === n && (n = "emit"), this.socket.send(this.worker.options.useBinary ? Buffer.from(encode(e, r, n)) : encode(e, r, n));
    }, e.prototype.disconnect = function(e, r) {
        this.socket.close(e, r);
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
        return "#0" === e ? s.send("#1") : n.broadcastMessage("", e);
    });
}

var Worker = function() {
    return function(e, r) {
        var n = this;
        this.wss = new WSServer(), this.options = e;
        for (var t = 0; t < this.options.brokers; t++) BrokerClient("ws://127.0.0.1:" + this.options.brokersPorts[t], r, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer(), 
        new WebSocketServer({
            server: this.server,
            verifyClient: function(e, r) {
                return n.wss.middleware.verifyConnection ? n.wss.middleware.verifyConnection(e, r) : r(!0);
            }
        }).on("connection", function(e) {
            return n.wss.emit("connection", new Socket(n, e));
        }), this.server.listen(this.options.port, this.options.host, function() {
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
        }, 5e3), e.pingInterval = setInterval(function() {
            return e.send("#0");
        }, 2e4), e.on("message", function(o) {
            if ("#1" !== o) {
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
            }
        }), e.on("close", function(r, n) {
            clearInterval(e.pingInterval), clearTimeout(e.authTimeOut), e.isAuth && (s[e.id] = null), 
            e = void 0;
        });
    }), function() {
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
