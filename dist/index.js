"use strict";

var cluster = require("cluster"), crypto = require("crypto");

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
    var e = !0, o = generateKey(16), s = {}, t = {};
    if (r.horizontalScaleOptions) i("Scaler", -1); else for (var n = 0; n < r.brokers; n++) i("Broker", n);
    function i(n, l) {
        var a = cluster.fork();
        a.on("message", function(o) {
            return "READY" === o.event && function(o, n, l) {
                if (!e) return logReady(o + " PID " + l + " has restarted");
                "Worker" === o && (t[n] = "       Worker: " + n + ", PID " + l);
                if ("Scaler" === o) for (var a = 0; a < r.brokers; a++) i("Broker", a);
                if ("Broker" === o && (s[n] = ">>> Broker on: " + r.brokersPorts[n] + ", PID " + l, 
                Object.keys(s).length === r.brokers)) for (var a = 0; a < r.workers; a++) i("Worker", a);
                if (Object.keys(s).length === r.brokers && Object.keys(t).length === r.workers) {
                    e = !1, logReady(">>> Master on: " + r.port + ", PID: " + process.pid + (r.tlsOptions ? " (secure)" : ""));
                    for (var c in s) s[c] && logReady(s[c]);
                    for (var c in t) t[c] && logReady(t[c]);
                }
            }(n, l, o.pid);
        }), a.on("exit", function() {
            logError(n + " has been disconnected \n"), r.restartWorkerOnFail && (logWarning(n + " is restarting \n"), 
            i(n, l)), a = null;
        }), a.send({
            key: o,
            processID: l,
            processName: n
        });
    }
}

function WorkerProcess(r) {
    process.send({
        event: "READY",
        pid: process.pid
    }), process.on("uncaughtException", function(r) {
        return logError("PID: " + process.pid + "\n" + r.stack + "\n"), process.exit();
    });
}

new ClusterWS({
    worker: function() {},
    workers: 10,
    brokers: 15
}), module.exports = ClusterWS, module.exports.default = ClusterWS;
