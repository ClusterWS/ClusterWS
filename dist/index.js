"use strict";

var cluster = require("cluster"), WebSocket = require("uws"), crypto = require("crypto");

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

function BrokerServer(r, e, o) {
    var n = [];
    new WebSocket.Server({
        port: r
    }, function() {
        return process.send({
            event: "READY",
            pid: process.pid
        });
    }).on("connection", function(r) {
        var o = !1, t = setInterval(function() {
            return r.send("#0");
        }, 2e4), s = setTimeout(function() {
            return r.close(4e3, "Not Authenticated");
        }, 5e3);
        r.on("message", function(t) {
            if ("#1" !== t) {
                if (t === e) {
                    if (o) return;
                    return o = !0, function r(e) {
                        e.id = generateKey(16);
                        for (var o = 0, t = n.length; o < t; o++) if (n[o].id === e.id) return r(e);
                        n.push(e);
                    }(r), clearTimeout(s);
                }
                o && function(r, e) {
                    for (var o = 0, t = n.length; o < t; o++) n[o].id !== r && n[o].send(e);
                }(r.id, t);
            }
        }), r.on("close", function(e, i) {
            if (clearTimeout(s), clearInterval(t), o) for (var c = 0, u = n.length; c < u; c++) if (n[c].id === r.id) return n.splice(c, 1);
            r = null;
        });
    });
}

var ClusterWS = function() {
    return function(r) {
        if ("[object Function]" !== {}.toString.call(r.worker)) return logError("Worker must be provided and it must be a function \n");
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
        if (!r.brokersPorts) for (var o = 0; o < e.brokers; o++) e.brokersPorts.push(9400 + o);
        if (e.brokersPorts.length < e.brokers) return logError("Number of broker ports is less than number of brokers \n");
        cluster.isMaster ? MasterProcess(e) : WorkerProcess(e);
    };
}();

function MasterProcess(r) {
    var e = !0, o = generateKey(16), n = {}, t = {};
    if (r.horizontalScaleOptions) i("Scaler", -1); else for (var s = 0; s < r.brokers; s++) i("Broker", s);
    function i(s, c) {
        var u = cluster.fork();
        u.on("message", function(o) {
            return "READY" === o.event && function(o, s, c) {
                if (!e) return logReady(o + " PID " + c + " has restarted");
                "Worker" === o && (t[s] = "       Worker: " + s + ", PID " + c);
                if ("Scaler" === o) for (var u = 0; u < r.brokers; u++) i("Broker", u);
                if ("Broker" === o && (n[s] = ">>> Broker on: " + r.brokersPorts[s] + ", PID " + c, 
                Object.keys(n).length === r.brokers)) for (var u = 0; u < r.workers; u++) i("Worker", u);
                if (Object.keys(n).length === r.brokers && Object.keys(t).length === r.workers) {
                    e = !1, logReady(">>> Master on: " + r.port + ", PID: " + process.pid + (r.tlsOptions ? " (secure)" : ""));
                    for (var a in n) n[a] && logReady(n[a]);
                    for (var a in t) t[a] && logReady(t[a]);
                }
            }(s, c, o.pid);
        }), u.on("exit", function() {
            logError(s + " has been disconnected \n"), r.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
            i(s, c)), u = null;
        }), u.send({
            key: o,
            processID: c,
            processName: s
        });
    }
}

function WorkerProcess(r) {
    process.on("message", function(e) {
        switch (e.processName) {
          case "Broker":
            return BrokerServer(r.brokersPorts[e.processID], e.key, r.horizontalScaleOptions);

          case "Worker":
            return process.send({
                event: "READY",
                pid: process.pid
            });
        }
    }), process.on("uncaughtException", function(r) {
        return logError("PID: " + process.pid + "\n" + r.stack + "\n"), process.exit();
    });
}

new ClusterWS({
    worker: function() {},
    brokers: 2,
    brokersPorts: [ 9400, 9032 ]
}), module.exports = ClusterWS, module.exports.default = ClusterWS;
