"use strict";

Object.defineProperty(exports, "__esModule", {
    value: !0
});

var crypto = require("crypto"), cluster = require("cluster");

class Logger {
    constructor(r) {
        this.level = r;
    }
    debug(r, e) {
        let o = e;
        "object" == typeof e && (o = JSON.stringify(e)), process.stdout.write(`[36mDebug:[0m ${r} ${o}\n`);
    }
    info(r) {
        process.stdout.write(`[32m✓ ${r}[0m\n`);
    }
    error(r) {
        process.stdout.write(`[31mError:[0m ${r}\n`);
    }
    warning() {}
}

function isFunction(r) {
    return "[object Function]" === {}.toString.call(r);
}

function generateUid(r) {
    return crypto.randomBytes(r).toString("hex");
}

class Worker {
    constructor(r, e) {
        this.options = r, console.log(`called in current process ${process.pid}`);
    }
}

function runProcesses(r) {
    if (r.mode === exports.Mode.CurrentProcess) return r.logger.info(` Running in single process on port: ${r.port}, PID ${process.pid} ${r.tlsOptions ? "(secure)" : ""}`), 
    new Worker(r);
    cluster.isMaster ? masterProcess(r) : childProcess(r);
}

function masterProcess(r) {
    let e;
    const o = generateUid(10), s = generateUid(20), t = [], n = [], i = (c, l, p) => {
        const g = cluster.fork();
        g.on("message", o => {
            if (r.logger.debug("Message from child", o), "READY" === o.event) {
                if (p) return r.logger.info(`${l} ${c} PID ${o.pid} has been restarted`);
                if ("Scaler" === l) {
                    e = ` Scaler on: ${r.horizontalScaleOptions.masterOptions.port}, PID ${o.pid}`;
                    for (let e = 0; e < r.brokers; e++) i(e, "Broker");
                }
                if ("Broker" === l && (t[c] = ` Broker on: ${r.brokersPorts[c]}, PID ${o.pid}`, 
                t.length === r.brokers && !t.includes(void 0))) for (let e = 0; e < r.workers; e++) i(e, "Worker");
                "Worker" === l && (n[c] = `    Worker: ${c}, PID ${o.pid}`, n.length !== r.workers || n.includes(void 0) || (r.logger.info(` Master on: ${r.port}, PID ${process.pid} ${r.tlsOptions ? "(secure)" : ""}`), 
                e && r.logger.info(e), t.forEach(r.logger.info), n.forEach(r.logger.info)));
            }
        }), g.on("exit", () => {
            r.logger.error(`${l} ${c} has exited`), r.restartWorkerOnFail && (r.logger.warning(`${l} ${c} is restarting \n`), 
            i(c, l, !0));
        }), g.send({
            id: c,
            name: l,
            serverId: o,
            securityKey: s
        });
    };
    for (let e = 0; e < r.brokers; e++) i(e, "Broker");
}

function childProcess(r) {
    process.on("message", e => {
        r.logger.debug("Message from master", e), process.send({
            event: "READY",
            pid: process.pid
        });
    });
}

!function(r) {
    r[r.Scale = 0] = "Scale", r[r.CurrentProcess = 1] = "CurrentProcess";
}(exports.Mode || (exports.Mode = {}));

class ClusterWS {
    constructor(r) {
        if (this.options = {
            port: r.port || (r.tlsOptions ? 443 : 80),
            mode: r.mode || exports.Mode.Scale,
            host: r.host,
            logger: r.logger || new Logger("info"),
            worker: r.worker,
            wsPath: r.wsPath || null,
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
        return isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? this.options.logger.error("Number of broker ports in not the same as number of brokers") : void runProcesses(this.options) : this.options.logger.error("Worker is not provided or is not a function");
    }
}

exports.default = ClusterWS; module.exports = exports["default"]
