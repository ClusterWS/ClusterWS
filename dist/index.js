"use strict";

var Mode, cluster = require("cluster");

class Logger {
    constructor(r) {
        this.level = r;
    }
    debug(r, o) {
        let e = o;
        "object" == typeof o && (e = JSON.stringify(o)), process.stdout.write(`[36mDebug:[0m ${r} ${e}\n`);
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

function runProcesses(r) {
    r.mode, Mode.CurrentProcess, cluster.isMaster ? masterProcess(r) : childProcess(r);
}

function masterProcess(r) {
    let o;
    const e = [], s = [], t = (n, i, l) => {
        const c = cluster.fork();
        c.on("message", c => {
            if (r.logger.debug("Message from child", c), "READY" === c.event) {
                if (l) return r.logger.info(`${i} ${n} PID ${c.pid} has been restarted`);
                if ("Scaler" === i) {
                    o = ` Scaler on: ${r.horizontalScaleOptions.masterOptions.port}, PID ${c.pid}`;
                    for (let o = 0; o < r.brokers; o++) t(o, "Broker");
                }
                if ("Broker" === i && (e[n] = ` Broker on: ${r.brokersPorts[n]}, PID ${c.pid}`, 
                e.length === r.brokers && !e.includes(void 0))) for (let o = 0; o < r.workers; o++) t(o, "Worker");
                "Worker" === i && (s[n] = `    Worker: ${n}, PID ${c.pid}`, s.length !== r.workers || s.includes(void 0) || (r.logger.info(` Master on: ${r.port}, PID ${process.pid} ${r.tlsOptions ? "(secure)" : ""}`), 
                o && r.logger.info(o), e.forEach(r.logger.info), s.forEach(r.logger.info)));
            }
        }), c.on("exit", () => {
            r.logger.error(`${i} ${n} has exited`), r.restartWorkerOnFail && (r.logger.warning(`${i} ${n} is restarting \n`), 
            t(n, i, !0));
        }), c.send({
            id: n,
            name: i
        });
    };
    for (let o = 0; o < r.brokers; o++) t(o, "Broker");
}

function childProcess(r) {
    process.on("message", o => {
        r.logger.debug("Message from master", o), process.send({
            event: "READY",
            pid: process.pid
        });
    });
}

!function(r) {
    r[r.Scale = 0] = "Scale", r[r.CurrentProcess = 1] = "CurrentProcess";
}(Mode || (Mode = {}));

class ClusterWS {
    constructor(r) {
        if (this.options = {
            port: r.port || (r.tlsOptions ? 443 : 80),
            mode: r.mode || Mode.Scale,
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

module.exports = ClusterWS; module.exports.default = ClusterWS;
