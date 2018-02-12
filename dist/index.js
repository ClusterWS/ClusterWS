"use strict";

var crypto = require("crypto"), WebSocket = require("uws"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster");

function logError(e) {
    return console.log("[31m%s[0m", e);
}

function logReady(e) {
    return console.log("[36m%s[0m", e);
}

function logWarning(e) {
    return console.log("[33m%s[0m", e);
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
            subsribe: {
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
        this.worker = e, this.socket = r, this.events = new EventEmitterSingle(), this.channels = {}, 
        this.missedPing = 0, this.onPublish = function(e, r) {
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
        }), this.socket.on("close", function(e, r) {
            for (var o in clearInterval(n), t.events.emit("disconnect", e, r), t.channels) t.channels[o] && t.worker.wss.channels.removeListener(o, t.onPublish);
            for (var o in t) t[o] && (t[o] = null);
        }), this.socket.on("message", function(e) {
            if ("string" != typeof e && (e = Buffer.from(e).toString()), "#1" === e) return t.missedPing = 0;
            try {
                e = JSON.parse(e);
            } catch (e) {
                return logError("PID: " + process.pid + "\n" + e + "\n");
            }
            decode(t, e);
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
        return void 0 === t && (t = 0), t > this.internalBrokers.brokersAmount + 10 ? logWarning("Does not have access to any broker") : this.internalBrokers.brokersAmount <= 0 ? setTimeout(function() {
            return n.publish(e, r, ++t);
        }, 10) : (this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++, 
        1 !== this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]].readyState ? (delete this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]], 
        this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), this.internalBrokers.brokersAmount--, 
        this.publish(e, r, ++t)) : (this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]].send(Buffer.from(e + "%" + JSON.stringify({
            message: r
        }))), "#sendToWorkers" === e ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, r) : (this.middleware.onPublish && this.middleware.onPublish.call(null, e, r), 
        void this.channels.emitMany(e, r))));
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

function BrokerClient(e, r, t) {
    void 0 === t && (t = 0);
    var n = new WebSocket(e.url);
    n.on("open", function() {
        t = 0, e.broadcaster.setBroker(n, e.url), r && logReady("Broker has been connected to " + e.url + "\n"), 
        n.send(e.key);
    }), n.on("error", function(o) {
        if ("uWs client connection error" === o.stack) return n = null, t > 5 && logWarning("Can not connect to the Broker: " + e.url + "\n"), 
        setTimeout(function() {
            return BrokerClient(e, r || !e.external || t > 5, t > 5 ? 0 : ++t);
        }, 50);
        logError("Socket " + process.pid + " has an issue: \n" + o.stack + "\n");
    }), n.on("close", function(r) {
        return 4e3 === r ? logError("Can not connect to the broker wrong authorization key") : (n = null, 
        logWarning("Something went wrong, system is trying to reconnect to " + e.url + "\n"), 
        setTimeout(function() {
            return BrokerClient(e, !0, ++t);
        }, 50));
    }), n.on("message", function(r) {
        return "#0" === r ? n.send("#1") : e.broadcaster.broadcastMessage("", r);
    });
}

var Worker = function() {
    return function(e, r) {
        var t = this;
        this.options = e, this.wss = new WSServer();
        for (var n = 0; n < this.options.brokers; n++) BrokerClient({
            key: r,
            external: !1,
            url: "ws://127.0.0.1:" + this.options.brokersPorts[n],
            broadcaster: this.wss
        });
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer(), 
        new WebSocket.Server({
            server: this.server,
            verifyClient: function(e, r) {
                return t.wss.middleware.verifyConnection ? t.wss.middleware.verifyConnection.call(null, e, r) : r(!0);
            }
        }).on("connection", function(e) {
            return t.wss.emit("connection", new Socket(t, e));
        }), this.server.listen(this.options.port, function() {
            t.options.worker.call(t), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    };
}();

function BrokerServer(e) {
    var r, t = {}, n = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === e.type && e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions.tlsOptions) {
        var o = HTTPS.createServer(e.horizontalScaleOptions.masterOptions.tlsOptions);
        r = new WebSocket.Server({
            server: o
        }), o.listen(e.port, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else r = new WebSocket.Server({
        port: e.port
    }, function() {
        return process.send({
            event: "READY",
            pid: process.pid
        });
    });
    function s(e, r) {
        for (var n in t) n !== e && t[n] && t[n].send(r);
    }
    function i(e, r) {
        void 0 === r && (r = ""), BrokerClient({
            key: r,
            external: !0,
            url: e,
            broadcaster: {
                broadcastMessage: s,
                setBroker: function(e, r) {
                    n.brokers[r] = e, n.brokersKeys = Object.keys(n.brokers), n.brokersAmount = n.brokersKeys.length;
                }
            }
        });
    }
    r.on("connection", function(r) {
        var o = !1, i = setInterval(function() {
            return r.send("#0");
        }, 2e4), l = setTimeout(function() {
            return r.close(4e3, "Not Authenticated");
        }, 5e3);
        r.on("message", function(i) {
            if ("#1" !== i) {
                if (i === e.key) {
                    if (o) return;
                    return o = !0, function e(r) {
                        r.id = generateKey(16);
                        if (t[r.id]) return e(r);
                        t[r.id] = r;
                    }(r), clearTimeout(l);
                }
                o && (s(r.id, i), "Scaler" !== e.type && e.horizontalScaleOptions && function e(r) {
                    if (n.brokersAmount <= 0) return;
                    n.nextBroker >= n.brokersAmount - 1 ? n.nextBroker = 0 : n.nextBroker++;
                    if (1 !== n.brokers[n.brokersKeys[n.nextBroker]].readyState) return delete n.brokers[n.brokersKeys[n.nextBroker]], 
                    n.brokersKeys = Object.keys(n.brokers), n.brokersAmount--, e(r);
                    n.brokers[n.brokersKeys[n.nextBroker]].send(r);
                }(i));
            }
        }), r.on("close", function(e, n) {
            clearInterval(i), clearTimeout(l), o && (t[r.id] = null), r = null;
        });
    }), function() {
        if ("Scaler" !== e.type && e.horizontalScaleOptions) {
            e.horizontalScaleOptions.masterOptions && i((e.horizontalScaleOptions.masterOptions.tlsOptions ? "wss" : "ws") + "://127.0.0.1:" + e.horizontalScaleOptions.masterOptions.port, e.horizontalScaleOptions.key);
            for (var r = 0, t = e.horizontalScaleOptions.brokersUrls.length; r < t; r++) i(e.horizontalScaleOptions.brokersUrls[r], e.horizontalScaleOptions.key);
        }
    }();
}

var ClusterWS = function() {
    function e(e) {
        if ("[object Function]" !== {}.toString.call(e.worker)) return logError("Worker must be provided and it must be a function \n");
        var r = {
            port: e.port || (e.tlsOptions ? 443 : 80),
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
        if (!e.brokersPorts) for (var t = 0; t < r.brokers; t++) r.brokersPorts.push(9400 + t);
        if (r.brokersPorts.length < r.brokers) return logError("Number of broker ports is less than number of brokers \n");
        cluster.isMaster ? this.masterProcess(r) : this.workerProcess(r);
    }
    return e.prototype.masterProcess = function(e) {
        var r = !1, t = generateKey(16), n = {}, o = {};
        if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (var s = 0; s < e.brokers; s++) i("Broker", s);
        function i(s, l) {
            var a = cluster.fork();
            a.on("message", function(t) {
                return "READY" === t.event && function(t, s, l) {
                    if (r) return logReady(t + " PID " + l + " has restarted");
                    "Worker" === t && (o[s] = "\tWorker: " + s + ", PID " + l);
                    if ("Scaler" === t) for (var a = 0; a < e.brokers; a++) i("Broker", a);
                    if ("Broker" === t && (n[s] = ">>>  Broker on: " + e.brokersPorts[s] + ", PID " + l, 
                    Object.keys(n).length === e.brokers)) for (var a = 0; a < e.workers; a++) i("Worker", a);
                    if (Object.keys(n).length === e.brokers && Object.keys(o).length === e.workers) {
                        for (var c in r = !0, logReady(">>>  Master on: " + e.port + ", PID: " + process.pid + (e.tlsOptions ? " (secure)" : "")), 
                        n) n[c] && logReady(n[c]);
                        for (var c in o) o[c] && logReady(o[c]);
                    }
                }(s, l, t.pid);
            }), a.on("exit", function() {
                logError(s + " is closed \n"), e.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
                i(s, l)), a = null;
            }), a.send({
                key: t,
                processId: l,
                processName: s
            });
        }
    }, e.prototype.workerProcess = function(e) {
        process.on("message", function(r) {
            var t = {
                Worker: function() {
                    return new Worker(e, r.key);
                },
                Broker: function() {
                    return BrokerServer({
                        key: r.key,
                        port: e.brokersPorts[r.processId],
                        horizontalScaleOptions: e.horizontalScaleOptions,
                        type: "Broker"
                    });
                },
                Scaler: function() {
                    return e.horizontalScaleOptions && BrokerServer({
                        key: e.horizontalScaleOptions.key || "",
                        port: e.horizontalScaleOptions.masterOptions.port,
                        horizontalScaleOptions: e.horizontalScaleOptions,
                        type: "Scaler"
                    });
                }
            };
            return t[r.processName] && t[r.processName].call(null);
        }), process.on("uncaughtException", function(e) {
            return logError("PID: " + process.pid + "\n" + e.stack + "\n"), process.exit();
        });
    }, e;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
