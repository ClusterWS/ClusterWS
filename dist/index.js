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
        var r = !1, o = generateKey(16), t = {}, e = {};
        if (this.options.horizontalScaleOptions && this.options.horizontalScaleOptions.masterOptions) n("Scaler", -1); else for (var s = 0; s < this.options.brokers; s++) n("Broker", s);
        function n(s, i) {
            var l = this, a = cluster.fork();
            a.on("message", function(o) {
                return "READY" === o.event && function(o, s, i) {
                    if (r) return logReady(o + " PID " + i + " has restarted");
                    "Worker" === o && (e[s] = "\tWorker: " + s + ", PID " + i);
                    if ("Scaler" === o) for (var l = 0; l < this.options.brokers; l++) n("Broker", l);
                    if ("Broker" === o && (t[s] = ">>>  Broker on: " + this.options.brokersPorts[s] + ", PID " + i, 
                    Object.keys(t).length === this.options.brokers)) for (var l = 0; l < this.options.workers; l++) n("Worker", l);
                    if (Object.keys(t).length === this.options.brokers && Object.keys(e).length === this.options.workers) {
                        r = !0, logReady(">>>  Master on: " + this.options.port + ", PID: " + process.pid + (this.options.tlsOptions ? " (secure)" : ""));
                        for (var a in t) t[a] && logReady(t[a]);
                        for (var a in e) e[a] && logReady(e[a]);
                    }
                }(s, i, o.pid);
            }), a.on("exit", function() {
                logError(s + " is closed \n"), l.options.restartWorkerOnFail && (logWarning(s + " is restarting \n"), 
                n(s, i)), a = null;
            }), a.send({
                key: o,
                processId: i,
                processName: s
            });
        }
    }, r.prototype.workerProcess = function() {
        console.log();
    }, r;
}();

module.exports = ClusterWS, module.exports.default = ClusterWS;
