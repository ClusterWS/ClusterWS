"use strict";

var Mode, crypto = require("crypto"), cluster = require("cluster"), HTTP = require("http"), HTTPS = require("https"), cws = require("@clusterws/cws");

class Logger {
    constructor(e) {
        this.level = e;
    }
    debug(e, t) {
        let r = t;
        "object" == typeof t && (r = JSON.stringify(t)), process.stdout.write(`[36mDebug:[0m ${e} - ${r}\n`);
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

class EventEmitter {
    constructor(e) {
        this.logger = e, this.events = {};
    }
    on(e, t) {
        if (!isFunction(t)) return this.logger.error("Listener must be a function");
        this.events[e] = t;
    }
    emit(e, ...t) {
        const r = this.events[e];
        r && r(...t);
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

class Socket {
    constructor(e, t) {
        this.worker = e, this.socket = t, this.id = generateUid(8), this.emitter = new EventEmitter(this.worker.options.logger);
        const r = JSON.stringify([ "e", "hello", {
            hello: "world",
            antoehr: "lol",
            box: "cloud"
        } ]);
        this.socket.on("message", e => {
            try {
                if ("string" != typeof e && (e = Buffer.from(r)), 91 !== e[0] && "[" !== e[0] && this.emitter.exist("message")) return this.emitter.emit("message", e);
                decode(this, JSON.parse(e.toString()));
            } catch (t) {
                if (this.emitter.exist("message")) return this.emitter.emit("message", e);
                console.log(t);
            }
        });
    }
    on(e, t) {
        this.emitter.on(e, t);
    }
    send(e, t, r = "emit") {
        this.socket.send(encode(e, t, r));
    }
    disconnect(e, t) {
        this.socket.close(e, t);
    }
    terminate() {
        this.socket.terminate();
    }
}

function encode(e, t, r) {
    const o = {
        emit: [ "e", e, t ],
        publish: [ "p", e, t ],
        system: {
            configuration: [ "s", "c", t ]
        }
    };
    return JSON.stringify(o[r][e] || o[r]);
}

function decode(e, t) {
    const [r, o, s] = t;
    if ("e" === r) return e.emitter.emit(o, s);
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
    constructor(e, t) {
        this.options = e, this.wss = new WSServer(this.options), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const r = new cws.WebSocketServer({
            path: this.options.wsPath,
            server: this.server
        });
        r.on("connection", e => {
            this.options.logger.debug("Worker", "new websocket connection"), this.wss.emit("connection", new Socket(this, e));
        }), this.options.autoPing && (console.log("ping"), r.startAutoPing(this.options.pingInterval, !0)), 
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
    let t;
    const r = generateUid(10), o = generateUid(20), s = [], i = [], n = (c, l, g) => {
        const h = cluster.fork();
        h.on("message", r => {
            if (e.logger.debug("Message from child", r), "READY" === r.event) {
                if (g) return e.logger.info(`${l} ${c} PID ${r.pid} has been restarted`);
                if ("Scaler" === l) {
                    t = ` Scaler on: ${e.horizontalScaleOptions.masterOptions.port}, PID ${r.pid}`;
                    for (let t = 0; t < e.brokers; t++) n(t, "Broker");
                }
                if ("Broker" === l && (s[c] = ` Broker on: ${e.brokersPorts[c]}, PID ${r.pid}`, 
                s.length === e.brokers && !s.includes(void 0))) for (let t = 0; t < e.workers; t++) n(t, "Worker");
                "Worker" === l && (i[c] = `    Worker: ${c}, PID ${r.pid}`, i.length !== e.workers || i.includes(void 0) || (e.logger.info(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                t && e.logger.info(t), s.forEach(e.logger.info), i.forEach(e.logger.info)));
            }
        }), h.on("exit", () => {
            e.logger.error(`${l} ${c} has exited`), e.restartWorkerOnFail && (e.logger.warning(`${l} ${c} is restarting \n`), 
            n(c, l, !0));
        }), h.send({
            id: c,
            name: l,
            serverId: r,
            securityKey: o
        });
    };
    for (let t = 0; t < e.brokers; t++) n(t, "Broker");
}

function childProcess(e) {
    process.on("message", t => {
        e.logger.debug("Message from master", t), process.send({
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
