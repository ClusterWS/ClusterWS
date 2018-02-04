"use strict";

var cluster = require("cluster"), HTTPS = require("https"), WebSocket = require("uws"), crypto = require("crypto"), Worker = function() {
    return function(r, o) {
        this.options = r, console.log();
    };
}();

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

function BrokerClient(r, o, e) {
    void 0 === e && (e = 0);
    var t = new WebSocket(r.url);
    t.on("open", function() {
        e = 0, r.broadcaster.setBroker(t, r.url), o && logReady("Broker's socket has been connected to " + r.url), 
        t.send(r.key);
    }), t.on("error", function(o) {
        if ("uWs client connection error" === o.stack) return t = null, e > 10 && logWarning("Can not connect to the Broker: " + r.url), 
        setTimeout(function() {
            return BrokerClient(r, !r.external || e > 10, e++);
        }, 20);
        logError("Socket " + process.pid + " has an issue: \n" + o.stack + "\n");
    }), t.on("close", function(o) {
        return 4e3 === o ? logError("Wrong authorization key") : (t = null, logWarning("Something went wrong," + (r.external ? " external " : " ") + "socket is trying to reconnect"), 
        setTimeout(function() {
            return BrokerClient(r, !0, e++);
        }, 20));
    }), t.on("message", function(o) {
        return "#0" === o ? t.send("#1") : r.broadcaster.broadcastMessage("", o);
    });
}

function BrokerServer(r) {
    var o, e = {}, t = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === r.type && r.horizontalScaleOptions && r.horizontalScaleOptions.masterOptions.tlsOptions) {
        var n = HTTPS.createServer(r.horizontalScaleOptions.masterOptions.tlsOptions);
        o = new WebSocket.Server({
            server: n
        }), n.listen(r.port, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else o = new WebSocket.Server({
        port: r.port
    });
    function s(r, o) {
        for (var t in e) t !== r && e[t] && e[t].send(o);
    }
    function i(r, o) {
        void 0 === o && (o = ""), BrokerClient({
            key: o,
            external: !0,
            url: r,
            broadcaster: {
                broadcastMessage: s,
                setBroker: function(r, o) {
                    t.brokers[o] = r, t.brokersKeys = Object.keys(t.brokers), t.brokersAmount = t.brokersKeys.length;
                }
            }
        });
    }
    o.on("connection", function(o) {
        var n = !1, i = setInterval(function() {
            return o.send("#0");
        }, 2e4), a = setTimeout(function() {
            return o.close(4e3, "Not Authenticated");
        }, 5e3);
        o.on("message", function(i) {
            if ("#1" !== i) {
                if (i === r.key) {
                    if (n) return;
                    return n = !0, function r(o) {
                        o.id = generateKey(16);
                        if (e[o.id]) return r(o);
                        e[o.id] = o;
                    }(o), clearTimeout(a);
                }
                n && (s(o.id, i), "Scaler" !== r.type && r.horizontalScaleOptions && 0 !== t.brokersAmount && function r(o, e) {
                    void 0 === e && (e = 0);
                    t.nextBroker >= t.brokersAmount - 1 ? t.nextBroker = 0 : t.nextBroker++;
                    if (1 !== t.brokers[t.brokersKeys[t.nextBroker]].readyState) return e++ > t.brokersAmount ? logError("Does not have access to any global Broker") : r(o, e++);
                    t.brokers[t.brokersKeys[t.nextBroker]].send(o);
                }(i));
            }
        }), o.on("close", function(r, t) {
            clearInterval(i), clearTimeout(a), n && (e[o.id] = null), o = null;
        });
    }), function() {
        if ("Scaler" !== r.type && r.horizontalScaleOptions) {
            r.horizontalScaleOptions.masterOptions && i((r.horizontalScaleOptions.masterOptions.tlsOptions ? "wss" : "ws") + "://127.0.0.1:" + r.horizontalScaleOptions.masterOptions.port, r.horizontalScaleOptions.key);
            for (var o = 0, e = r.horizontalScaleOptions.brokersUrls.length; o < e; o++) i(r.horizontalScaleOptions.brokersUrls[o], r.horizontalScaleOptions.key);
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
        }, !r.brokersPorts) for (var o = 0; o < this.options.brokers; o++) this.options.brokersPorts.push(9400 + o);
        if (this.options.brokersPorts.length < this.options.brokers) return logError("Number of broker ports is less than number of brokers \n");
        cluster.isMaster ? this.masterProcess() : this.workerProcess();
    }
    return r.prototype.masterProcess = function() {
        var r = !1, o = generateKey(16), e = {}, t = {};
        if (this.options.horizontalScaleOptions && this.options.horizontalScaleOptions.masterOptions) s("Scaler", -1); else for (var n = 0; n < this.options.brokers; n++) s("Broker", n);
        function s(n, i) {
            var a = this, l = cluster.fork();
            l.on("message", function(o) {
                return "READY" === o.event && function(o, n, i) {
                    if (r) return logReady(o + " PID " + i + " has restarted");
                    "Worker" === o && (t[n] = "\tWorker: " + n + ", PID " + i);
                    if ("Scaler" === o) for (var a = 0; a < this.options.brokers; a++) s("Broker", a);
                    if ("Broker" === o && (e[n] = ">>>  Broker on: " + this.options.brokersPorts[n] + ", PID " + i, 
                    Object.keys(e).length === this.options.brokers)) for (var a = 0; a < this.options.workers; a++) s("Worker", a);
                    if (Object.keys(e).length === this.options.brokers && Object.keys(t).length === this.options.workers) {
                        r = !0, logReady(">>>  Master on: " + this.options.port + ", PID: " + process.pid + (this.options.tlsOptions ? " (secure)" : ""));
                        for (var l in e) e[l] && logReady(e[l]);
                        for (var l in t) t[l] && logReady(t[l]);
                    }
                }(n, i, o.pid);
            }), l.on("exit", function() {
                logError(n + " is closed \n"), a.options.restartWorkerOnFail && (logWarning(n + " is restarting \n"), 
                s(n, i)), l = null;
            }), l.send({
                key: o,
                processId: i,
                processName: n
            });
        }
    }, r.prototype.workerProcess = function() {
        var r = this;
        process.on("message", function(o) {
            switch (o.processName) {
              case "Broker":
                return BrokerServer({
                    key: o.key,
                    port: r.options.brokersPorts[o.processId],
                    horizontalScaleOptions: r.options.horizontalScaleOptions,
                    type: "Broker"
                });

              case "Worker":
                return new Worker(r.options, o.key);

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
