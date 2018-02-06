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

var EventEmitterSingle = function() {
    function e() {
        this.events = {};
    }
    return e.prototype.on = function(e, r) {
        if ("[object Function]" !== {}.toString.call(r)) return logError("Listener must be a function");
        this.events[e] = r;
    }, e.prototype.emit = function(e) {
        for (var r = [], t = 1; t < arguments.length; t++) r[t - 1] = arguments[t];
        var o = this.events[e];
        o && o.call.apply(o, [ null ].concat(r));
    }, e.prototype.removeEvents = function() {
        this.events = {};
    }, e;
}(), Socket = function() {
    function e(e, r) {
        this.worker = e, this.socket = r, this.events = new EventEmitterSingle(), this.channels = {}, 
        this.missedPing = 0;
    }
    return e.prototype.on = function(e, r) {
        this.events.on(e, r);
    }, e.prototype.send = function(e, r, t) {
        void 0 === t && (t = "emit");
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
        var o, n = this.events[e];
        if (n) for (var s = 0, i = n.length; s < i; s++) (o = n[s]).call.apply(o, [ null, e ].concat(r));
    }, e.prototype.removeListener = function(e, r) {
        var t = this.events[e];
        if (t) {
            for (var o = 0, n = t.length; o < n; o++) if (t[o] === r) return t.splice(o, 1);
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
        var o = this;
        return void 0 === t && (t = 0), t > 2 * this.internalBrokers.brokersAmount && t > 10 ? logWarning("Faild to publish message") : 0 === this.internalBrokers.brokersAmount ? setTimeout(function() {
            return o.publish(e, r, t++);
        }, 20) : (this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++, 
        1 !== this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]].readyState ? this.publish(e, r, t++) : (this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]].send(Buffer.from(e + "%" + JSON.stringify({
            message: r
        }))), "#sendToWorkers" === e ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, r) : (this.middleware.onPublish && this.middleware.onPublish.call(null, e, r), 
        void this.channels.emitMany(e, r))));
    }, r.prototype.broadcastMessage = function(e, r) {
        var t = (r = Buffer.from(r)).indexOf(37), o = r.slice(0, t).toString();
        if ("#sendToWorkers" === o) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, JSON.parse(r.slice(t + 1)).message);
        if (!this.channels.exist(o)) {
            var n = JSON.parse(r.slice(t + 1)).message;
            this.middleware.onPublish && this.middleware.onPublish.call(null, o, n), this.channels.emitMany(o, n);
        }
    }, r.prototype.setBroker = function(e, r) {
        this.internalBrokers.brokers[r] = e, this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;
    }, r;
}(EventEmitterSingle);

function BrokerClient(e, r, t) {
    void 0 === t && (t = 0);
    var o = new WebSocket(e.url);
    o.on("open", function() {
        t = 0, e.broadcaster.setBroker(o, e.url), r && logReady("Broker's socket has been connected to " + e.url), 
        o.send(e.key);
    }), o.on("error", function(r) {
        if ("uWs client connection error" === r.stack) return o = null, t > 10 && logWarning("Can not connect to the Broker: " + e.url), 
        setTimeout(function() {
            return BrokerClient(e, !e.external || t > 10, t++);
        }, 20);
        logError("Socket " + process.pid + " has an issue: \n" + r.stack + "\n");
    }), o.on("close", function(r) {
        return 4e3 === r ? logError("Wrong authorization key") : (o = null, logWarning("Something went wrong," + (e.external ? " external " : " ") + "socket is trying to reconnect"), 
        setTimeout(function() {
            return BrokerClient(e, !0, t++);
        }, 20));
    }), o.on("message", function(r) {
        return "#0" === r ? o.send("#1") : e.broadcaster.broadcastMessage("", r);
    });
}

var Worker = function() {
    return function(e, r) {
        var t = this;
        this.options = e, this.wss = new WSServer();
        for (var o = 0; o < this.options.brokers; o++) BrokerClient({
            key: r,
            external: !1,
            url: "ws://127.0.0.1:" + this.options.brokersPorts[o],
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
    var r, t = {}, o = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === e.type && e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions.tlsOptions) {
        var n = HTTPS.createServer(e.horizontalScaleOptions.masterOptions.tlsOptions);
        r = new WebSocket.Server({
            server: n
        }), n.listen(e.port, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else r = new WebSocket.Server({
        port: e.port
    });
    function s(e, r) {
        for (var o in t) o !== e && t[o] && t[o].send(r);
    }
    function i(e, r) {
        void 0 === r && (r = ""), BrokerClient({
            key: r,
            external: !0,
            url: e,
            broadcaster: {
                broadcastMessage: s,
                setBroker: function(e, r) {
                    o.brokers[r] = e, o.brokersKeys = Object.keys(o.brokers), o.brokersAmount = o.brokersKeys.length;
                }
            }
        });
    }
    r.on("connection", function(r) {
        var n = !1, i = setInterval(function() {
            return r.send("#0");
        }, 2e4), a = setTimeout(function() {
            return r.close(4e3, "Not Authenticated");
        }, 5e3);
        r.on("message", function(i) {
            if ("#1" !== i) {
                if (i === e.key) {
                    if (n) return;
                    return n = !0, function e(r) {
                        r.id = generateKey(16);
                        if (t[r.id]) return e(r);
                        t[r.id] = r;
                    }(r), clearTimeout(a);
                }
                n && (s(r.id, i), "Scaler" !== e.type && e.horizontalScaleOptions && 0 !== o.brokersAmount && function e(r, t) {
                    void 0 === t && (t = 0);
                    o.nextBroker >= o.brokersAmount - 1 ? o.nextBroker = 0 : o.nextBroker++;
                    if (1 !== o.brokers[o.brokersKeys[o.nextBroker]].readyState) return t++ > o.brokersAmount ? logError("Does not have access to any global Broker") : e(r, t++);
                    o.brokers[o.brokersKeys[o.nextBroker]].send(r);
                }(i));
            }
        }), r.on("close", function(e, o) {
            clearInterval(i), clearTimeout(a), n && (t[r.id] = null), r = null;
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
        if (this.options = {
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
        }, !e.brokersPorts) for (var r = 0; r < this.options.brokers; r++) this.options.brokersPorts.push(9400 + r);
        if (this.options.brokersPorts.length < this.options.brokers) return logError("Number of broker ports is less than number of brokers \n");
        cluster.isMaster ? this.masterProcess() : this.workerProcess();
    }
    return e.prototype.masterProcess = function() {
        var e = !1, r = generateKey(16), t = {}, o = {};
        if (this.options.horizontalScaleOptions && this.options.horizontalScaleOptions.masterOptions) s("Scaler", -1); else for (var n = 0; n < this.options.brokers; n++) s("Broker", n);
        function s(n, i) {
            var a = this, l = cluster.fork();
            l.on("message", function(r) {
                return "READY" === r.event && function(r, n, i) {
                    if (e) return logReady(r + " PID " + i + " has restarted");
                    "Worker" === r && (o[n] = "\tWorker: " + n + ", PID " + i);
                    if ("Scaler" === r) for (var a = 0; a < this.options.brokers; a++) s("Broker", a);
                    if ("Broker" === r && (t[n] = ">>>  Broker on: " + this.options.brokersPorts[n] + ", PID " + i, 
                    Object.keys(t).length === this.options.brokers)) for (var a = 0; a < this.options.workers; a++) s("Worker", a);
                    if (Object.keys(t).length === this.options.brokers && Object.keys(o).length === this.options.workers) {
                        for (var l in e = !0, logReady(">>>  Master on: " + this.options.port + ", PID: " + process.pid + (this.options.tlsOptions ? " (secure)" : "")), 
                        t) t[l] && logReady(t[l]);
                        for (var l in o) o[l] && logReady(o[l]);
                    }
                }(n, i, r.pid);
            }), l.on("exit", function() {
                logError(n + " is closed \n"), a.options.restartWorkerOnFail && (logWarning(n + " is restarting \n"), 
                s(n, i)), l = null;
            }), l.send({
                key: r,
                processId: i,
                processName: n
            });
        }
    }, e.prototype.workerProcess = function() {
        var e = this;
        process.on("message", function(r) {
            switch (r.processName) {
              case "Broker":
                return BrokerServer({
                    key: r.key,
                    port: e.options.brokersPorts[r.processId],
                    horizontalScaleOptions: e.options.horizontalScaleOptions,
                    type: "Broker"
                });

              case "Worker":
                return new Worker(e.options, r.key);

              case "Scaler":
                return e.options.horizontalScaleOptions && BrokerServer({
                    key: e.options.horizontalScaleOptions.key,
                    port: e.options.horizontalScaleOptions.masterOptions.port,
                    horizontalScaleOptions: e.options.horizontalScaleOptions,
                    type: "Scaler"
                });
            }
        }), process.on("uncaughtException", function(e) {
            return logError("PID: " + process.pid + "\n" + e.stack + "\n"), process.exit();
        });
    }, e;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
