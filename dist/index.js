"use strict";

var crypto = require("crypto"), WebSocket = require("uws"), HTTPS = require("https"), cluster = require("cluster"), Worker = function() {
    return function(r, e) {
        this.options = r;
    };
}();

function logError(r) {
    return console.log("[31m" + r + "[0m");
}

function logReady(r) {
    return console.log("[36m" + r + "[0m");
}

function logWarning(r) {
    return console.log("[33m" + r + "[0m");
}

function generateKey(r) {
    return crypto.randomBytes(Math.ceil(r / 2)).toString("hex").slice(0, r);
}

function BrokerClient(r, e, o, t, n) {
    void 0 === t && (t = 0);
    var s = new WebSocket(r);
    s.on("open", function() {
        o.setBroker(s, r), n && logReady("Broker has been connected to " + r + " \n"), s.send(e);
    }), s.on("error", function(n) {
        if (s = void 0, "uWs client connection error" === n.stack) return 5 === t && logWarning("Can not connect to the Broker " + r + ". System in reconnection state please check your Broker and URL"), 
        setTimeout(function() {
            return BrokerClient(r, e, o, ++t, t > 5);
        }, 50);
        logError("Socket " + process.pid + " has an issue: \n " + n.stack + " \n");
    }), s.on("close", function(n) {
        if (s = void 0, 4e3 === n) return logError("Can not connect to the broker wrong authorization key");
        logWarning("Broker has disconnected, system is trying to reconnect to " + r + " \n"), 
        setTimeout(function() {
            return BrokerClient(r, e, o, ++t, !0);
        }, 50);
    }), s.on("message", function(r) {
        return "#0" === r ? s.send("#1") : o.broadcastMessage("", r);
    });
}

function BrokerServer(r, e, o, t) {
    var n, s = {}, i = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === t && o && o.masterOptions && o.masterOptions.tlsOptions) {
        var c = HTTPS.createServer(o.masterOptions.tlsOptions);
        n = new WebSocket.Server({
            server: c
        }), c.listen(r, function() {
            return process.send({
                event: "READY",
                pid: process.pid
            });
        });
    } else n = new WebSocket.Server({
        port: r
    }, function() {
        return process.send({
            event: "READY",
            pid: process.pid
        });
    });
    function a(r, e) {
        for (var o = 0, t = Object.keys(s), n = t.length; o < n; o++) t[o] !== r && s[t[o]] && s[t[o]].send(e);
    }
    function u(r, e) {
        void 0 === e && (e = ""), BrokerClient(r, e, {
            broadcastMessage: a,
            setBroker: function(r, e) {
                i.brokers[e] = r, i.brokersKeys = Object.keys(i.brokers), i.brokersAmount = i.brokersKeys.length;
            }
        });
    }
    n.on("connection", function(r) {
        r.isAuth = !1, r.authTimeOut = setTimeout(function() {
            return r.close(4e3, "Not Authenticated");
        }, 5e3), r.pingInterval = setInterval(function() {
            return r.send("#0");
        }, 2e4), r.on("message", function(n) {
            if ("#1" !== n) {
                if (n === e) {
                    if (r.isAuth) return;
                    return r.isAuth = !0, function r(e) {
                        e.id = generateKey(16);
                        if (s[e.id]) return r(e);
                        s[e.id] = e;
                    }(r), clearTimeout(r.authTimeOut);
                }
                r.isAuth && (a(r.id, n), "Scaler" !== t && o && function r(e) {
                    if (i.brokersAmount <= 0) return;
                    i.nextBroker >= i.brokersAmount - 1 ? i.nextBroker = 0 : i.nextBroker++;
                    var o = i.brokers[i.brokersKeys[i.nextBroker]];
                    if (1 !== o.readyState) return delete i.brokers[i.brokersKeys[i.nextBroker]], i.brokersKeys = Object.keys(i.brokers), 
                    i.brokersAmount--, r(e);
                    o.send(e);
                }(n));
            }
        }), r.on("close", function(e, o) {
            clearInterval(r.pingInterval), clearTimeout(r.authTimeOut), r.isAuth && (s[r.id] = null), 
            r = void 0;
        });
    }), function() {
        if ("Scaler" === t || !o) return;
        o.masterOptions && u((o.masterOptions.tlsOptions ? "wss" : "ws") + "://127.0.0.1:" + o.masterOptions.port, o.key);
        for (var r = 0, e = o.brokersUrls.length; r < e; r++) u(o.brokersUrls[r], o.key);
    }();
}

var ClusterWS = function() {
    function r(r) {
        if ("[object Function]" !== {}.toString.call(r.worker)) return logError("Worker param must be provided and it must be a function \n");
        var e = {
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
        };
        if (!r.brokersPorts) for (var o = 0; o < e.brokers; o++) e.brokersPorts.push(o + 9400);
        if (e.brokersPorts.length < e.brokers) return logError("Number of the broker ports can not be less than number of brokers \n");
        cluster.isMaster ? this.masterProcess(e) : this.workerProcess(e);
    }
    return r.prototype.masterProcess = function(r) {
        var e = !1, o = generateKey(16), t = {}, n = {};
        if (r.horizontalScaleOptions && r.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (var s = 0; s < r.brokers; s++) i("Broker", s);
        function i(s, c) {
            var a = cluster.fork();
            a.on("message", function(o) {
                return "READY" === o.event && function(o, s, c) {
                    if (e) return logReady(o + " PID " + c + " has been restarted");
                    "Worker" === o && (n[s] = "\tWorker: " + s + ", PID " + c);
                    if ("Scaler" === o) for (var a = 0; a < r.brokers; a++) i("Broker", a);
                    if ("Broker" === o && (t[s] = ">>>  Broker on: " + r.brokersPorts[s] + ", PID " + c, 
                    Object.keys(t).length === r.brokers)) for (var a = 0; a < r.workers; a++) i("Worker", a);
                    Object.keys(t).length === r.brokers && Object.keys(n).length === r.workers && (e = !0, 
                    logReady(">>>  Master on: " + r.port + ", PID: " + process.pid + " " + (r.tlsOptions ? " (secure)" : "")), 
                    Object.keys(t).forEach(function(r) {
                        return t.hasOwnProperty(r) && logReady(t[r]);
                    }), Object.keys(n).forEach(function(r) {
                        return n.hasOwnProperty(r) && logReady(n[r]);
                    }));
                }(s, c, o.pid);
            }), a.on("exit", function() {
                logError(s + " has exited \n"), r.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
                i(s, c)), a = void 0;
            }), a.send({
                securityKey: o,
                processId: c,
                processName: s
            });
        }
    }, r.prototype.workerProcess = function(r) {
        process.on("message", function(e) {
            var o = {
                Worker: function() {
                    return new Worker(r, e.securityKey);
                },
                Broker: function() {
                    return BrokerServer(r.brokersPorts[e.processId], e.securityKey, r.horizontalScaleOptions, "Broker");
                },
                Scaler: function() {
                    return r.horizontalScaleOptions && BrokerServer(r.horizontalScaleOptions.masterOptions.port, r.horizontalScaleOptions.key || "", r.horizontalScaleOptions, "Scaler");
                }
            };
            o[e.processName] && o[e.processName].call(null);
        }), process.on("uncaughtException", function(r) {
            return logError("PID: " + process.pid + "\n " + r.stack + "\n"), process.exit();
        });
    }, r;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
