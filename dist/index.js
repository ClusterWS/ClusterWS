"use strict";

var Mode, crypto = require("crypto"), cluster = require("cluster"), HTTP = require("http"), HTTPS = require("https"), cws = require("@clusterws/cws");

class Logger {
    constructor(e) {
        this.level = e;
    }
    debug(e, r) {
        let o = r;
        "object" == typeof r && (o = JSON.stringify(r)), process.stdout.write(`[36mDebug:[0m ${e} - ${o}\n`);
    }
    info(e) {
        process.stdout.write(`[32m✓ ${e}[0m\n`);
    }
    error(e) {
        process.stdout.write(`[31mError:[0m ${e}\n`);
    }
    warning() {}
}

function isFunction(e) {
    return "[object Function]" === {}.toString.call(e);
}

function generateUid(e) {
    return crypto.randomBytes(e).toString("hex");
}

class Socket {
    constructor(e, r) {
        this.worker = e, this.socket = r;
    }
}

class EventEmitter {
    constructor(e) {
        this.logger = e, this.events = {};
    }
    on(e, r) {
        if (!isFunction(r)) return this.logger.error("Listener must be a function");
        this.events[e] = r;
    }
    emit(e, ...r) {
        const o = this.events[e];
        o && o(...r);
    }
    exist(e) {
        return !!this.events[e];
    }
    off(e) {
        delete this.events[e];
    }
    removeEvents() {
        this.events = {};
    }
}

class WSServer extends EventEmitter {
    constructor(e) {
        super(e.logger), this.options = e;
    }
}

!function(e) {
    e[e.Scale = 0] = "Scale", e[e.CurrentProcess = 1] = "CurrentProcess";
}(Mode || (Mode = {}));

class Worker {
    constructor(e, r) {
        this.options = e, this.wss = new WSServer(this.options), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const o = new cws.WebSocketServer({
            path: this.options.wsPath,
            server: this.server
        });
        o.on("connection", e => {
            this.options.logger.debug("Worker", "new websocket connection"), this.wss.emit("connection", new Socket(this, e));
        }), this.options.autoPing && (console.log("ping"), o.startAutoPing(this.options.pingInterval, !0)), 
        this.server.on("error", e => {
            this.options.logger.error(`Worker ${e.stack || e}`), this.options.mode === Mode.Scale && process.exit();
        }), this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), this.options.mode === Mode.Scale && process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

function runProcesses(e) {
    if (e.mode === Mode.CurrentProcess) return e.logger.info(` Running in single process on port: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
    new Worker(e);
    cluster.isMaster ? masterProcess(e) : childProcess(e);
}

function masterProcess(e) {
    let r;
    const o = generateUid(10), s = generateUid(20), t = [], n = [], i = (c, l, p) => {
        const g = cluster.fork();
        g.on("message", o => {
            if (e.logger.debug("Message from child", o), "READY" === o.event) {
                if (p) return e.logger.info(`${l} ${c} PID ${o.pid} has been restarted`);
                if ("Scaler" === l) {
                    r = ` Scaler on: ${e.horizontalScaleOptions.masterOptions.port}, PID ${o.pid}`;
                    for (let r = 0; r < e.brokers; r++) i(r, "Broker");
                }
                if ("Broker" === l && (t[c] = ` Broker on: ${e.brokersPorts[c]}, PID ${o.pid}`, 
                t.length === e.brokers && !t.includes(void 0))) for (let r = 0; r < e.workers; r++) i(r, "Worker");
                "Worker" === l && (n[c] = `    Worker: ${c}, PID ${o.pid}`, n.length !== e.workers || n.includes(void 0) || (e.logger.info(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                r && e.logger.info(r), t.forEach(e.logger.info), n.forEach(e.logger.info)));
            }
        }), g.on("exit", () => {
            e.logger.error(`${l} ${c} has exited`), e.restartWorkerOnFail && (e.logger.warning(`${l} ${c} is restarting \n`), 
            i(c, l, !0));
        }), g.send({
            id: c,
            name: l,
            serverId: o,
            securityKey: s
        });
    };
    for (let r = 0; r < e.brokers; r++) i(r, "Broker");
}

function childProcess(e) {
    process.on("message", r => {
        e.logger.debug("Message from master", r), process.send({
            event: "READY",
            pid: process.pid
        });
    });
}

class ClusterWS {
    constructor(e) {
        if (this.options = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            mode: e.mode || Mode.Scale,
            host: e.host,
            logger: e.logger || new Logger("info"),
            worker: e.worker,
            wsPath: e.wsPath || null,
            workers: e.workers || 1,
            brokers: e.brokers || 1,
            autoPing: !1 !== e.autoPing,
            useBinary: e.useBinary,
            tlsOptions: e.tlsOptions,
            pingInterval: e.pingInterval || 2e4,
            brokersPorts: e.brokersPorts || [],
            encodeDecodeEngine: e.encodeDecodeEngine,
            restartWorkerOnFail: e.restartWorkerOnFail,
            horizontalScaleOptions: e.horizontalScaleOptions
        }, !this.options.brokersPorts.length) for (let e = 0; e < this.options.brokers; e++) this.options.brokersPorts.push(e + 9400);
        return isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? this.options.logger.error("Number of broker ports in not the same as number of brokers") : void runProcesses(this.options) : this.options.logger.error("Worker is not provided or is not a function");
    }
}

module.exports = ClusterWS; module.exports.default = ClusterWS;
