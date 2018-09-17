"use strict";

var crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), clusterwsUws = require("clusterws-uws"), cluster = require("cluster");

function logError(r) {
    return process.stdout.write(`[31mError PID ${process.pid}:[0m  ${r}\n`);
}

function logReady(r) {
    return process.stdout.write(`[32m✓ ${r}[0m\n`);
}

function logWarning(r) {
    return process.stdout.write(`[33mWarning PID ${process.pid}:[0m ${r}\n`);
}

function isFunction(r) {
    return "[object Function]" === {}.toString.call(r);
}

function generateKey(r) {
    return crypto.randomBytes(r).toString("hex");
}

class Worker {
    constructor(r) {
        this.options = r, this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const e = new clusterwsUws.WebSocketServer({
            server: this.server,
            verifyClient: (r, e) => {}
        });
        e.on("connection", r => {}), e.startAutoPing(this.options.pingInterval, !0), this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

function masterProcess(r) {
    let e = !1;
    const o = [], s = [], t = generateKey(20), n = generateKey(20);
    if (r.horizontalScaleOptions && r.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (let e = 0; e < r.brokers; e++) i("Broker", e);
    function i(c, a) {
        const p = cluster.fork();
        p.on("message", t => {
            if ("READY" === t.event) {
                if (e) return logReady(`${c} ${a} PID ${t.pid} has been restarted`);
                switch (c) {
                  case "Broker":
                    if (o[a] = ` Broker on: ${r.brokersPorts[a]}, PID ${t.pid}`, !o.includes(void 0) && o.length === r.brokers) for (let e = 0; e < r.workers; e++) i("Worker", e);
                    break;

                  case "Worker":
                    s[a] = `    Worker: ${a}, PID ${t.pid}`, s.includes(void 0) || s.length !== r.workers || (e = !0, 
                    logReady(` Master on: ${r.port}, PID ${process.pid} ${r.tlsOptions ? "(secure)" : ""}`), 
                    o.forEach(logReady), s.forEach(logReady));
                    break;

                  case "Scaler":
                    for (let e = 0; e < r.brokers; e++) i("Broker", e);
                }
            }
        }), p.on("exit", () => {
            logError(`${c} ${a} has exited`), r.restartWorkerOnFail && (logWarning(`${c} ${a} is restarting \n`), 
            i(c, a));
        }), p.send({
            processId: a,
            processName: c,
            serverId: t,
            internalSecurityKey: n
        });
    }
}

function workerProcess(r) {
    process.on("message", e => {
        switch (e.processName) {
          case "Worker":
            return new Worker(r);
        }
    }), process.on("uncaughtException", r => {
        logError(`PID: ${process.pid}\n ${r.stack || r}\n`), process.exit();
    });
}

class ClusterWS {
    constructor(r) {
        if (this.options = {
            port: r.port || (r.tlsOptions ? 443 : 80),
            host: r.host,
            worker: r.worker,
            workers: r.workers || 1,
            brokers: r.brokers || 1,
            useBinary: r.useBinary,
            tlsOptions: r.tlsOptions,
            pingInterval: r.pingInterval || 2e4,
            brokersPorts: r.brokersPorts || [],
            encodeDecodeEngine: r.encodeDecodeEngine,
            restartWorkerOnFail: r.restartWorkerOnFail,
            horizontalScaleOptions: r.horizontalScaleOptions
        }, !this.options.brokersPorts.length) for (let r = 0; r < this.options.brokers; r++) this.options.brokersPorts.push(r + 9400);
        return isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? logError("Number of broker ports should be the same as number of brokers") : void (cluster.isMaster ? masterProcess(this.options) : workerProcess(this.options)) : logError("Worker must be provided and it must be a function");
    }
}

module.exports = ClusterWS; module.exports.default = ClusterWS;
