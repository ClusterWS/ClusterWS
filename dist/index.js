"use strict";

var crypto = require("crypto"), WebSocket = require("uws"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster");

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

function encode(e, r, t) {
    var n = {
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
    return "ping" === t ? e : JSON.stringify("system" === t ? n[t][e] : n[t]);
}

function decode(e, r) {
    var t = {
        e: function() {
            return e.events.emit(r["#"][1], r["#"][2]);
        },
        p: function() {
            return e.channels[r["#"][1]] && e.worker.wss.publish(r["#"][1], r["#"][2]);
        },
        s: {
            s: function() {
                var t = function() {
                    e.channels[r["#"][2]] = 1, e.worker.wss.channels.onMany(r["#"][2], e.onPublish);
                };
                e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe.call(null, e, r["#"][2], function(e) {
                    return e && t.call(null);
                }) : t.call(null);
            },
            u: function() {
                e.worker.wss.channels.removeListener(r["#"][2], e.onPublish), e.channels[r["#"][2]] = null;
            }
        }
    };
    return "s" === r["#"][0] ? t[r["#"][0]][r["#"][1]] && t[r["#"][0]][r["#"][1]].call(null) : t[r["#"][0]] && t[r["#"][0]].call(null);
}

var EventEmitterSingle = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.on = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] = r;
    }, e.prototype.emit = function(e) {
        for (var r = [], t = 1; t < arguments.length; t++) r[t - 1] = arguments[t];
        var n = this.events[e];
        n && n.call.apply(n, [ null ].concat(r));
    }, e.prototype.removeEvents = function() {
        this.events = {};
    }, e;
}(), Socket = function() {
    function e(e, r) {
        var t = this;
        this.events = new EventEmitterSingle(), this.channels = {}, this.missedPing = 0, 
        this.worker = e, this.socket = r, this.onPublish = function(e, r) {
            return t.send(e, r, "publish");
        };
        var n = setInterval(function() {
            return t.missedPing++ > 2 ? t.disconnect(4001, "No pongs") : t.send("#0", null, "ping");
        }, this.worker.options.pingInterval);
        this.send("configuration", {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        }, "system"), this.socket.on("error", function(e) {
            return t.events.emit("error", e);
        }), this.socket.on("message", function(e) {
            if ("string" != typeof e && (e = Buffer.from(e).toString()), "#1" === e) return t.missedPing = 0;
            try {
                e = JSON.parse(e);
            } catch (e) {
                return logError("PID: " + process.pid + "\n" + e + "\n");
            }
            decode(t, e);
        }), this.socket.on("close", function(e, r) {
            clearInterval(n), t.events.emit("disconnect", e, r);
            for (var o = 0, s = (i = Object.keys(t.channels)).length; o < s; o++) t.worker.wss.channels.removeListener(i[o], t.onPublish);
            var i;
            for (o = 0, s = (i = Object.keys(t)).length; o < s; o++) t[i[o]] = null;
        });
    }
    return e.prototype.on = function(e, r) {
        this.events.on(e, r);
    }, e.prototype.send = function(e, r, t) {
        void 0 === t && (t = "emit"), this.socket.send(this.worker.options.useBinary ? Buffer.from(encode(e, r, t)) : encode(e, r, t));
    }, e.prototype.disconnect = function(e, r) {
        this.socket.close(e, r);
    }, e;
}(), extendStatics = Object.setPrototypeOf || {
    __proto__: []
} instanceof Array && function(e, r) {
    e.__proto__ = r;
} || function(e, r) {
    for (var t in r) r.hasOwnProperty(t) && (e[t] = r[t]);
};

function __extends(e, r) {
    function t() {
        this.constructor = e;
    }
    extendStatics(e, r), e.prototype = null === r ? Object.create(r) : (t.prototype = r.prototype, 
    new t());
}

var EventEmitterMany = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.onMany = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push(r) : this.events[e] = [ r ];
    }, e.prototype.emitMany = function(e) {
        for (var r = [], t = 1; t < arguments.length; t++) r[t - 1] = arguments[t];
        var n, o = this.events[e];
        if (o) for (var s = 0, i = o.length; s < i; s++) (n = o[s]).call.apply(n, [ null, e ].concat(r));
    }, e.prototype.removeListener = function(e, r) {
        var t = this.events[e];
        if (t) {
            for (var n = 0, o = t.length; n < o; n++) if (t[n] === r) return t.splice(n, 1);
            0 === t.length && (this.events[e] = null);
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
    }, r.prototype.publish = function(e, r, t) {
        var n = this;
        if (void 0 === t && (t = 0), t > 2 * this.internalBrokers.brokersAmount + 10) return logWarning("Does not have access to any broker");
        if (this.internalBrokers.brokersAmount <= 0) return setTimeout(function() {
            return n.publish(e, r, ++t);
        }, 10);
        this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++;
        var o = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]];
        return 1 !== o.readyState ? (delete this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]], 
        this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), this.internalBrokers.brokersAmount--, 
        this.publish(e, r, ++t)) : (o.send(Buffer.from(e + "%" + JSON.stringify({
            message: r
        }))), "#sendToWorkers" === e ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, r) : (this.middleware.onPublish && this.middleware.onPublish.call(null, e, r), 
        void this.channels.emitMany(e, r)));
    }, r.prototype.broadcastMessage = function(e, r) {
        var t = (r = Buffer.from(r)).indexOf(37), n = r.slice(0, t).toString();
        if ("#sendToWorkers" === n) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, JSON.parse(r.slice(t + 1)).message);
        if (this.channels.exist(n)) {
            var o = JSON.parse(r.slice(t + 1)).message;
            this.middleware.onPublish && this.middleware.onPublish.call(null, n, o), this.channels.emitMany(n, o);
        }
    }, r.prototype.setBroker = function(e, r) {
        this.internalBrokers.brokers[r] = e, this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;
    }, r;
}(EventEmitterSingle);

function BrokerClient(e, r, t, n, o) {
    void 0 === n && (n = 0);
    var s = new WebSocket(e);
    s.on("open", function() {
        n = 0, t.setBroker(s, e), o && logReady("Broker has been connected to " + e + " \n"), 
        s.send(r);
    }), s.on("error", function(i) {
        if (s = void 0, "uWs client connection error" === i.stack) return 5 === n && logWarning("Can not connect to the Broker " + e + ". System in reconnection state please check your Broker and URL \n"), 
        setTimeout(function() {
            return BrokerClient(e, r, t, ++n, o || n > 5);
        }, 500);
        logError("Socket " + process.pid + " has an issue: \n " + i.stack + " \n");
    }), s.on("close", function(o) {
        if (s = void 0, 4e3 === o) return logError("Can not connect to the broker wrong authorization key \n");
        logWarning("Broker has disconnected, system is trying to reconnect to " + e + " \n"), 
        setTimeout(function() {
            return BrokerClient(e, r, t, ++n, !0);
        }, 500);
    }), s.on("message", function(e) {
        return "#0" === e ? s.send("#1") : t.broadcastMessage("", e);
    });
}

var Worker = function() {
    return function(e, r) {
        var t = this;
        this.wss = new WSServer(), this.options = e;
        for (var n = 0; n < this.options.brokers; n++) BrokerClient("ws://127.0.0.1:" + this.options.brokersPorts[n], r, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer(), 
        new WebSocket.Server({
            server: this.server,
            verifyClient: function(e, r) {
                return t.wss.middleware.verifyConnection ? t.wss.middleware.verifyConnection.call(null, e, r) : r(!0);
            }
        }).on("connection", function(e) {
            return t.wss.emit("connection", new Socket(t, e));
        }), this.server.listen(this.options.port, this.options.host, function() {
            t.options.worker.call(t), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    };
}();

function BrokerServer(e, r, t, n) {
    var o, s = {}, i = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === n && t && t.masterOptions && t.masterOptions.tlsOptions) {
        var c = HTTPS.createServer(t.masterOptions.tlsOptions);
        o = new WebSocket.Server({
            server: c
        }), c.listen(e, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else o = new WebSocket.Server({
        port: e
    }, function() {
        return process.send({
            event: "READY",
            pid: process.pid
        });
    });
    function a(e, r) {
        for (var t = 0, n = Object.keys(s), o = n.length; t < o; t++) n[t] !== e && s[n[t]] && s[n[t]].send(r);
    }
    function l(e, r) {
        void 0 === r && (r = ""), BrokerClient(e, r, {
            broadcastMessage: a,
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
                e.isAuth && (a(e.id, o), "Scaler" !== n && t && function e(r) {
                    if (i.brokersAmount <= 0) return;
                    i.nextBroker >= i.brokersAmount - 1 ? i.nextBroker = 0 : i.nextBroker++;
                    var t = i.brokers[i.brokersKeys[i.nextBroker]];
                    if (1 !== t.readyState) return delete i.brokers[i.brokersKeys[i.nextBroker]], i.brokersKeys = Object.keys(i.brokers), 
                    i.brokersAmount--, e(r);
                    t.send(r);
                }(o));
            }
        }), e.on("close", function(r, t) {
            clearInterval(e.pingInterval), clearTimeout(e.authTimeOut), e.isAuth && (s[e.id] = null), 
            e = void 0;
        });
    }), function() {
        if ("Scaler" === n || !t) return;
        t.masterOptions && l((t.masterOptions.tlsOptions ? "wss" : "ws") + "://127.0.0.1:" + t.masterOptions.port, t.key);
        for (var e = 0, r = t.brokersUrls.length; e < r; e++) l(t.brokersUrls[e], t.key);
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
        if (!e.brokersPorts) for (var t = 0; t < r.brokers; t++) r.brokersPorts.push(t + 9400);
        if (r.brokersPorts.length < r.brokers) return logError("Number of the broker ports can not be less than number of brokers \n");
        cluster.isMaster ? this.masterProcess(r) : this.workerProcess(r);
    }
    return e.prototype.masterProcess = function(e) {
        var r = !1, t = generateKey(16), n = {}, o = {};
        if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (var s = 0; s < e.brokers; s++) i("Broker", s);
        function i(s, c) {
            var a = cluster.fork();
            a.on("message", function(t) {
                return "READY" === t.event && function(t, s, c) {
                    if (r) return logReady(t + " PID " + c + " has been restarted");
                    "Worker" === t && (o[s] = "\tWorker: " + s + ", PID " + c);
                    if ("Scaler" === t) for (var a = 0; a < e.brokers; a++) i("Broker", a);
                    if ("Broker" === t && (n[s] = ">>>  Broker on: " + e.brokersPorts[s] + ", PID " + c, 
                    Object.keys(n).length === e.brokers)) for (var a = 0; a < e.workers; a++) i("Worker", a);
                    Object.keys(n).length === e.brokers && Object.keys(o).length === e.workers && (r = !0, 
                    logReady(">>>  Master on: " + e.port + ", PID: " + process.pid + " " + (e.tlsOptions ? " (secure)" : "")), 
                    Object.keys(n).forEach(function(e) {
                        return n.hasOwnProperty(e) && logReady(n[e]);
                    }), Object.keys(o).forEach(function(e) {
                        return o.hasOwnProperty(e) && logReady(o[e]);
                    }));
                }(s, c, t.pid);
            }), a.on("exit", function() {
                logError(s + " has exited \n"), e.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
                i(s, c)), a = void 0;
            }), a.send({
                securityKey: t,
                processId: c,
                processName: s
            });
        }
    }, e.prototype.workerProcess = function(e) {
        process.on("message", function(r) {
            var t = {
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
            t[r.processName] && t[r.processName].call(null);
        }), process.on("uncaughtException", function(e) {
            return logError("PID: " + process.pid + "\n " + e.stack + "\n"), process.exit();
        });
    }, e;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
