"use strict";

var crypto = require("crypto"), WebSocket = require("uws"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster");

function logError(r) {
    return console.log("[31m%s[0m", r);
}

function logReady(r) {
    return console.log("[36m%s[0m", r);
}

function logWarning(r) {
    return console.log("[33m%s[0m", r);
}

function generateKey(r) {
    return crypto.randomBytes(Math.ceil(r / 2)).toString("hex").slice(0, r);
}

function BrokerClient(r, e, o) {
    void 0 === o && (o = 0);
    var t = new WebSocket(r.url);
    t.on("open", function() {
        o = 0, r.broadcaster.setBroker(t, r.url), e && logReady("Broker's socket has been connected to " + r.url), 
        t.send(r.key);
    }), t.on("error", function(e) {
        if ("uWs client connection error" === e.stack) return t = null, o > 10 && logWarning("Can not connect to the Broker: " + r.url), 
        setTimeout(function() {
            return BrokerClient(r, !r.external || o > 10, o++);
        }, 20);
        logError("Socket " + process.pid + " has an issue: \n" + e.stack + "\n");
    }), t.on("close", function(e) {
        return 4e3 === e ? logError("Wrong authorization key") : (t = null, logWarning("Something went wrong," + (r.external ? " external " : " ") + "socket is trying to reconnect"), 
        setTimeout(function() {
            return BrokerClient(r, !0, o++);
        }, 20));
    }), t.on("message", function(e) {
        return "#0" === e ? t.send("#1") : r.broadcaster.broadcastMessage("", e);
    });
}

var EventEmitterMany = function() {
    function r() {
        this.events = {};
    }
    return r.prototype.onMany = function(r, e) {
        if ("[object Function]" !== {}.toString.call(e)) return logError("Listener must be a function");
        this.events[r] ? this.events[r].push(e) : this.events[r] = [ e ];
    }, r.prototype.emitMany = function(r) {
        for (var e = [], o = 1; o < arguments.length; o++) e[o - 1] = arguments[o];
        var t, n = this.events[r];
        if (n) for (var s = 0, i = n.length; s < i; s++) (t = n[s]).call.apply(t, [ null, r ].concat(e));
    }, r.prototype.removeListener = function(r, e) {
        var o = this.events[r];
        if (o) {
            for (var t = 0, n = o.length; t < n; t++) if (o[t] === e) return o.splice(t, 1);
            0 === o.length && (this.events[r] = null);
        }
    }, r.prototype.exist = function(r) {
        return this.events[r] && this.events[r].length > 0;
    }, r;
}(), WSServer = function() {
    function r() {
        this.channels = new EventEmitterMany(), this.middleware = {}, this.internalBrokers = {
            brokers: {},
            nextBroker: -1,
            brokersKeys: [],
            brokersAmount: 0
        };
    }
    return r.prototype.setMiddleware = function(r, e) {
        this.middleware[r] = e;
    }, r.prototype.publishToWorkers = function(r) {
        this.publish("#sendToWorkers", r);
    }, r.prototype.publish = function(r, e, o) {
        var t = this;
        return void 0 === o && (o = 0), o > 2 * this.internalBrokers.brokersAmount && o > 10 ? logWarning("Faild to publish message") : 0 === this.internalBrokers.brokersAmount ? setTimeout(function() {
            return t.publish(r, e, o++);
        }, 20) : (this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++, 
        1 !== this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]].readyState ? this.publish(r, e, o++) : (this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]].send(Buffer.from(r + "%" + JSON.stringify({
            message: e
        }))), "#sendToWorkers" === r ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, e) : (this.middleware.onPublish && this.middleware.onPublish.call(null, r, e), 
        void this.channels.emitMany(r, e))));
    }, r.prototype.broadcastMessage = function(r, e) {
        var o = (e = Buffer.from(e)).indexOf(37), t = e.slice(0, o).toString();
        if ("#sendToWorkers" === t) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, JSON.parse(e.slice(o + 1)).message);
        if (!this.channels.exist(t)) {
            var n = JSON.parse(e.slice(o + 1)).message;
            this.middleware.onPublish && this.middleware.onPublish.call(null, t, n), this.channels.emitMany(t, n);
        }
    }, r.prototype.setBroker = function(r, e) {
        this.internalBrokers.brokers[e] = r, this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;
    }, r;
}(), Worker = function() {
    return function(r, e) {
        var o = this;
        this.options = r, this.wss = new WSServer();
        for (var t = 0; t < this.options.brokers; t++) BrokerClient({
            key: e,
            external: !1,
            url: "ws://127.0.0.1:" + this.options.brokersPorts[t],
            broadcaster: this.wss
        });
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer(), 
        new WebSocket.Server({
            server: this.server,
            verifyClient: function(r, e) {
                return o.wss.middleware.verifyConnection ? o.wss.middleware.verifyConnection.call(null, r, e) : e(!0);
            }
        }), this.server.listen(this.options.port, function() {
            o.options.worker.call(o), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    };
}();

function BrokerServer(r) {
    var e, o = {}, t = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === r.type && r.horizontalScaleOptions && r.horizontalScaleOptions.masterOptions.tlsOptions) {
        var n = HTTPS.createServer(r.horizontalScaleOptions.masterOptions.tlsOptions);
        e = new WebSocket.Server({
            server: n
        }), n.listen(r.port, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else e = new WebSocket.Server({
        port: r.port
    });
    function s(r, e) {
        for (var t in o) t !== r && o[t] && o[t].send(e);
    }
    function i(r, e) {
        void 0 === e && (e = ""), BrokerClient({
            key: e,
            external: !0,
            url: r,
            broadcaster: {
                broadcastMessage: s,
                setBroker: function(r, e) {
                    t.brokers[e] = r, t.brokersKeys = Object.keys(t.brokers), t.brokersAmount = t.brokersKeys.length;
                }
            }
        });
    }
    e.on("connection", function(e) {
        var n = !1, i = setInterval(function() {
            return e.send("#0");
        }, 2e4), a = setTimeout(function() {
            return e.close(4e3, "Not Authenticated");
        }, 5e3);
        e.on("message", function(i) {
            if ("#1" !== i) {
                if (i === r.key) {
                    if (n) return;
                    return n = !0, function r(e) {
                        e.id = generateKey(16);
                        if (o[e.id]) return r(e);
                        o[e.id] = e;
                    }(e), clearTimeout(a);
                }
                n && (s(e.id, i), "Scaler" !== r.type && r.horizontalScaleOptions && 0 !== t.brokersAmount && function r(e, o) {
                    void 0 === o && (o = 0);
                    t.nextBroker >= t.brokersAmount - 1 ? t.nextBroker = 0 : t.nextBroker++;
                    if (1 !== t.brokers[t.brokersKeys[t.nextBroker]].readyState) return o++ > t.brokersAmount ? logError("Does not have access to any global Broker") : r(e, o++);
                    t.brokers[t.brokersKeys[t.nextBroker]].send(e);
                }(i));
            }
        }), e.on("close", function(r, t) {
            clearInterval(i), clearTimeout(a), n && (o[e.id] = null), e = null;
        });
    }), function() {
        if ("Scaler" !== r.type && r.horizontalScaleOptions) {
            r.horizontalScaleOptions.masterOptions && i((r.horizontalScaleOptions.masterOptions.tlsOptions ? "wss" : "ws") + "://127.0.0.1:" + r.horizontalScaleOptions.masterOptions.port, r.horizontalScaleOptions.key);
            for (var e = 0, o = r.horizontalScaleOptions.brokersUrls.length; e < o; e++) i(r.horizontalScaleOptions.brokersUrls[e], r.horizontalScaleOptions.key);
        }
    }();
}

var ClusterWS = function() {
    function r(r) {
        if ("[object Function]" !== {}.toString.call(r.worker)) return logError("Worker must be provided and it must be a function \n");
        if (this.options = {
            port: r.port || (r.tlsOptions ? 443 : 80),
            worker: r.worker,
            workers: r.workers || 1,
            brokers: r.brokers || 1,
            useBinary: r.useBinary || !1,
            brokersPorts: r.brokersPorts || [],
            tlsOptions: r.tlsOptions || !1,
            pingInterval: r.pingInterval || 2e4,
            restartWorkerOnFail: r.restartWorkerOnFail || !1,
            horizontalScaleOptions: r.horizontalScaleOptions || !1
        }, !r.brokersPorts) for (var e = 0; e < this.options.brokers; e++) this.options.brokersPorts.push(9400 + e);
        if (this.options.brokersPorts.length < this.options.brokers) return logError("Number of broker ports is less than number of brokers \n");
        cluster.isMaster ? this.masterProcess() : this.workerProcess();
    }
    return r.prototype.masterProcess = function() {
        var r = !1, e = generateKey(16), o = {}, t = {};
        if (this.options.horizontalScaleOptions && this.options.horizontalScaleOptions.masterOptions) s("Scaler", -1); else for (var n = 0; n < this.options.brokers; n++) s("Broker", n);
        function s(n, i) {
            var a = this, l = cluster.fork();
            l.on("message", function(e) {
                return "READY" === e.event && function(e, n, i) {
                    if (r) return logReady(e + " PID " + i + " has restarted");
                    "Worker" === e && (t[n] = "\tWorker: " + n + ", PID " + i);
                    if ("Scaler" === e) for (var a = 0; a < this.options.brokers; a++) s("Broker", a);
                    if ("Broker" === e && (o[n] = ">>>  Broker on: " + this.options.brokersPorts[n] + ", PID " + i, 
                    Object.keys(o).length === this.options.brokers)) for (var a = 0; a < this.options.workers; a++) s("Worker", a);
                    if (Object.keys(o).length === this.options.brokers && Object.keys(t).length === this.options.workers) {
                        for (var l in r = !0, logReady(">>>  Master on: " + this.options.port + ", PID: " + process.pid + (this.options.tlsOptions ? " (secure)" : "")), 
                        o) o[l] && logReady(o[l]);
                        for (var l in t) t[l] && logReady(t[l]);
                    }
                }(n, i, e.pid);
            }), l.on("exit", function() {
                logError(n + " is closed \n"), a.options.restartWorkerOnFail && (logWarning(n + " is restarting \n"), 
                s(n, i)), l = null;
            }), l.send({
                key: e,
                processId: i,
                processName: n
            });
        }
    }, r.prototype.workerProcess = function() {
        var r = this;
        process.on("message", function(e) {
            switch (e.processName) {
              case "Broker":
                return BrokerServer({
                    key: e.key,
                    port: r.options.brokersPorts[e.processId],
                    horizontalScaleOptions: r.options.horizontalScaleOptions,
                    type: "Broker"
                });

              case "Worker":
                return new Worker(r.options, e.key);

              case "Scaler":
                return r.options.horizontalScaleOptions && BrokerServer({
                    key: r.options.horizontalScaleOptions.key,
                    port: r.options.horizontalScaleOptions.masterOptions.port,
                    horizontalScaleOptions: r.options.horizontalScaleOptions,
                    type: "Scaler"
                });
            }
        }), process.on("uncaughtException", function(r) {
            return logError("PID: " + process.pid + "\n" + r.stack + "\n"), process.exit();
        });
    }, r;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
