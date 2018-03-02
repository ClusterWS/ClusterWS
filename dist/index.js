"use strict";

var crypto = require("crypto"), cluster = require("cluster");

function logError(r) {
    return console.log("[31m" + r + "[0m");
}

function logReady(r, e) {
    return void 0 === e && (e = !1), console.log("[36m" + r + "[0m");
}

function logWarning(r) {
    return console.log("[33m" + r + "[0m");
}

function generateKey(r) {
    return crypto.randomBytes(Math.ceil(r / 2)).toString("hex").slice(0, r);
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
        var e = !1, o = generateKey(16), t = {}, s = {};
        if (r.horizontalScaleOptions && r.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (var n = 0; n < r.brokers; n++) i("Broker", n);
        function i(n, a) {
            var l = cluster.fork();
            l.on("message", function(o) {
                return "READY" === o.event && function(o, n, a) {
                    if (e) return logReady(o + " PID " + a + " has been restarted");
                    "Worker" === o && (s[n] = "\tWorker: " + n + ", PID " + a);
                    if ("Scaler" === o) for (var l = 0; l < r.brokers; l++) i("Broker", l);
                    if ("Broker" === o && (t[n] = ">>>  Broker on: " + r.brokersPorts[n] + ", PID " + a, 
                    Object.keys(t).length === r.brokers)) for (var l = 0; l < r.workers; l++) i("Worker", l);
                    Object.keys(t).length === r.brokers && Object.keys(s).length === r.workers && (e = !0, 
                    logReady(">>>  Master on: " + r.port + ", PID: " + process.pid + " " + (r.tlsOptions ? " (secure)" : "")), 
                    Object.keys(t).forEach(function(r) {
                        return t.hasOwnProperty(r) && logReady(t[r]);
                    }), Object.keys(s).forEach(function(r) {
                        return s.hasOwnProperty(r) && logReady(s[r]);
                    }));
                }(n, a, o.pid);
            }), l.on("exit", function() {
                logError(n + " has exited \n"), r.restartWorkerOnFail && (logWarning(n + " is restarting \n"), 
                i(n, a)), l = void 0;
            }), l.send({
                securityKey: o,
                processId: a,
                processName: n
            });
        }
    }, r.prototype.workerProcess = function(r) {
        console.log("here");
    }, r;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
