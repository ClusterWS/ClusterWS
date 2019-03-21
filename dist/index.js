"use strict";

var Mode, Level, crypto = require("crypto"), cluster = require("cluster"), HTTP = require("http"), HTTPS = require("https"), cws = require("@clusterws/cws");

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
    on(e, s) {
        if (!isFunction(s)) return this.logger.error("Listener must be a function");
        this.events[e] = s;
    }
    emit(e, ...s) {
        const t = this.events[e];
        t && t(...s);
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
    constructor(e, s) {
        this.worker = e, this.socket = s, this.id = generateUid(8), this.channels = {}, 
        this.emitter = new EventEmitter(this.worker.options.logger), this.worker.wss.pubSub.register(this.id, e => {
            this.send(null, e, "publish");
        }), this.socket.on("message", e => {
            if (this.emitter.exist("message")) return this.emitter.emit("message", e);
            try {
                if (91 !== e[0] && "[" !== e[0]) return this.emitter.exist("error") ? this.emitter.emit("error", new Error("Received message is not correct structure")) : (this.worker.options.logger.error("Received message is not correct structure"), 
                this.terminate());
                decode(this, JSON.parse(e.toString()));
            } catch (e) {
                if (this.emitter.exist("error")) return this.emitter.emit("error", e);
                this.worker.options.logger.error(e), this.terminate();
            }
        }), this.socket.on("close", (e, s) => {
            this.emitter.emit("disconnect", e, s), this.emitter.removeEvents();
        }), this.socket.on("error", e => {
            if (this.emitter.exist("error")) return this.emitter.emit("error", e);
            this.worker.options.logger.error(e), this.socket.terminate();
        });
    }
    on(e, s) {
        this.emitter.on(e, s);
    }
    send(e, s, t = "emit") {
        this.socket.send(encode(e, s, t));
    }
    disconnect(e, s) {
        this.socket.close(e, s);
    }
    terminate() {
        this.socket.terminate();
    }
}

function encode(e, s, t) {
    const r = {
        emit: [ "e", e, s ],
        publish: [ "p", e, s ],
        system: {
            configuration: [ "s", "c", s ]
        }
    };
    return JSON.stringify(r[t][e] || r[t]);
}

function decode(e, s) {
    const [t, r, o] = s;
    if ("e" === t) return e.emitter.emit(r, o);
    if ("p" === t) return e.channels[r] && e.worker.wss.publish(r, o, e.id);
    if ("s" === t) {
        if ("s" === r) return e.channels[o] = !0, e.worker.wss.subscribe(e.id, o);
        if ("u" === r) return delete e.channels[o], e.worker.wss.unsubscribe(e.id, o);
    }
}

class PubSubEngine {
    constructor(e, s) {
        this.logger = e, this.interval = s, this.hooks = {}, this.users = {}, this.batches = {}, 
        this.channels = {}, this.run();
    }
    addListener(e, s) {
        this.hooks[e] = s;
    }
    register(e, s) {
        this.users[e] = s;
    }
    subscribe(e, s) {
        return this.users[e] ? this.channels[s] ? this.channels[s].push(e) : (this.logger.debug("PubSubEngine", `'${s}' has been created`), 
        this.hooks.channelAdd && this.hooks.channelAdd(s), void (this.channels[s] = [ "broker", e ])) : this.logger.warning(`Trying to subscribe not existing user ${e}`);
    }
    unsubscribe(e, s) {
        const t = this.channels[s];
        if (t && t.length) {
            const s = t.indexOf(e);
            -1 !== s && t.splice(s, 1);
        }
        t && 1 === t.length && (this.logger.debug("PubSubEngine", `'${s}' has been removed`), 
        this.hooks.channelDelete && this.hooks.channelDelete(s), delete this.channels[s]);
    }
    publish(e, s, t) {
        const r = this.batches[e];
        if (r) return r.push({
            userId: t,
            message: s
        });
        this.batches[e] = [ {
            userId: t,
            message: s
        } ];
    }
    flush() {
        const e = {};
        for (const s in this.batches) if (this.batches[s]) {
            const t = this.channels[s];
            if (t) {
                const r = this.batches[s], o = r.length;
                for (let i = 0, n = t.length; i < n; i++) {
                    const n = t[i], h = [];
                    for (let e = 0; e < o; e++) r[e].userId !== n && h.push(r[e].message);
                    h.length && (e[n] || (e[n] = {}), e[n][s] = h);
                }
            }
        }
        this.batches = {};
        for (const s in e) this.users[s] && this.users[s](e[s]);
    }
    run() {
        setTimeout(() => {
            this.flush(), this.run();
        }, this.interval);
    }
}

class WSServer extends EventEmitter {
    constructor(e, s) {
        super(e.logger), this.options = e, this.pubSub = new PubSubEngine(e.logger, 1e3), 
        this.pubSub.register("broker", e => {});
    }
    publish(e, s, t) {
        this.pubSub.publish(e, s, t);
    }
    subscribe(e, s) {
        this.pubSub.subscribe(e, s);
    }
    unsubscribe(e, s) {
        this.pubSub.unsubscribe(e, s);
    }
}

!function(e) {
    e[e.Scale = 0] = "Scale", e[e.CurrentProcess = 1] = "CurrentProcess";
}(Mode || (Mode = {}));

class Worker {
    constructor(e, s) {
        this.options = e, this.wss = new WSServer(this.options, s), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const t = new cws.WebSocketServer({
            path: this.options.wsPath,
            server: this.server,
            verifyClient: (e, s) => {
                s(!0);
            }
        });
        t.on("connection", e => {
            this.options.logger.debug("Worker", "new websocket connection"), this.wss.emit("connection", new Socket(this, e));
        }), this.options.autoPing && t.startAutoPing(this.options.pingInterval, !0), this.server.on("error", e => {
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
    new Worker(e, "");
    cluster.isMaster ? masterProcess(e) : childProcess(e);
}

function masterProcess(e) {
    let s;
    const t = generateUid(10), r = generateUid(20), o = [], i = [], n = (h, c, l) => {
        const u = cluster.fork();
        u.on("message", t => {
            if (e.logger.debug("Message from child", t), "READY" === t.event) {
                if (l) return e.logger.info(`${c} ${h} PID ${t.pid} has been restarted`);
                if ("Scaler" === c) {
                    s = ` Scaler on: ${e.horizontalScaleOptions.masterOptions.port}, PID ${t.pid}`;
                    for (let s = 0; s < e.brokers; s++) n(s, "Broker");
                }
                if ("Broker" === c && (o[h] = ` Broker on: ${e.brokersPorts[h]}, PID ${t.pid}`, 
                o.length === e.brokers && !o.includes(void 0))) for (let s = 0; s < e.workers; s++) n(s, "Worker");
                "Worker" === c && (i[h] = `    Worker: ${h}, PID ${t.pid}`, i.length !== e.workers || i.includes(void 0) || (e.logger.info(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                s && e.logger.info(s), o.forEach(e.logger.info), i.forEach(e.logger.info)));
            }
        }), u.on("exit", () => {
            e.logger.error(`${c} ${h} has exited`), e.restartWorkerOnFail && (e.logger.warning(`${c} ${h} is restarting \n`), 
            n(h, c, !0));
        }), u.send({
            id: h,
            name: c,
            serverId: t,
            securityKey: r
        });
    };
    for (let s = 0; s < e.brokers; s++) n(s, "Broker");
}

function childProcess(e) {
    process.on("message", s => {
        switch (e.logger.debug("Message from master", s), s.name) {
          case "Worker":
            return new Worker(e, s.securityKey);

          default:
            process.send({
                event: "READY",
                pid: process.pid
            });
        }
    }), process.on("uncaughtException", s => {
        e.logger.error(`${s.stack || s}`), process.exit();
    });
}

!function(e) {
    e[e.ALL = 0] = "ALL", e[e.DEBUG = 1] = "DEBUG", e[e.INFO = 2] = "INFO", e[e.WARN = 3] = "WARN", 
    e[e.ERROR = 4] = "ERROR";
}(Level || (Level = {}));

class Logger {
    constructor(e) {
        this.level = e;
    }
    debug(e, s) {
        if (this.level > Level.DEBUG) return;
        let t = s;
        "object" == typeof s && (t = JSON.stringify(s)), process.stdout.write(`[36mDebug:[0m ${e} - ${t}\n`);
    }
    info(e) {
        this.level > Level.INFO || process.stdout.write(`[32m✓ ${e}[0m\n`);
    }
    error(e) {
        this.level > Level.ERROR || process.stdout.write(`[31mError:[0m ${e}\n`);
    }
    warning() {
        this.level, Level.WARN;
    }
}

class ClusterWS {
    constructor(e) {
        if (this.options = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            mode: e.mode || Mode.Scale,
            host: e.host,
            logger: e.logger || new Logger(Level.INFO),
            worker: e.worker,
            wsPath: e.wsPath || null,
            workers: e.workers || 1,
            brokers: e.brokers || 1,
            autoPing: !1 !== e.autoPing,
            tlsOptions: e.tlsOptions,
            pingInterval: e.pingInterval || 2e4,
            brokersPorts: e.brokersPorts || [],
            restartWorkerOnFail: e.restartWorkerOnFail,
            horizontalScaleOptions: e.horizontalScaleOptions
        }, !this.options.brokersPorts.length) for (let e = 0; e < this.options.brokers; e++) this.options.brokersPorts.push(e + 9400);
        return isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? this.options.logger.error("Number of broker ports in not the same as number of brokers") : void runProcesses(this.options) : this.options.logger.error("Worker is not provided or is not a function");
    }
}

module.exports = ClusterWS; module.exports.default = ClusterWS;
