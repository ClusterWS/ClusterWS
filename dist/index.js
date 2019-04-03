"use strict";

Object.defineProperty(exports, "__esModule", {
    value: !0
});

var cluster = require("cluster"), crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), cws = require("@clusterws/cws");

!function(e) {
    e[e.Scale = 0] = "Scale", e[e.SingleProcess = 1] = "SingleProcess";
}(exports.Mode || (exports.Mode = {})), function(e) {
    e[e.onSubscribe = 0] = "onSubscribe", e[e.onUnsubscribe = 1] = "onUnsubscribe", 
    e[e.verifyConnection = 2] = "verifyConnection", e[e.onChannelOpen = 3] = "onChannelOpen", 
    e[e.onChannelClose = 4] = "onChannelClose";
}(exports.Middleware || (exports.Middleware = {})), function(e) {
    e[e.ALL = 0] = "ALL", e[e.DEBUG = 1] = "DEBUG", e[e.INFO = 2] = "INFO", e[e.WARN = 3] = "WARN", 
    e[e.ERROR = 4] = "ERROR";
}(exports.LogLevel || (exports.LogLevel = {}));

class Logger {
    constructor(e) {
        this.level = e;
    }
    debug(...e) {
        this.level > exports.LogLevel.DEBUG || console.log("[36mdebug:[0m", ...e.map(e => "object" == typeof e ? JSON.stringify(e) : e));
    }
    info(...e) {
        this.level > exports.LogLevel.INFO || console.log("[32minfo:[0m", ...e);
    }
    error(...e) {
        this.level > exports.LogLevel.ERROR || console.log("[31merror:[0m", ...e);
    }
    warning(...e) {
        this.level > exports.LogLevel.WARN || console.log("[33mwarning:[0m", ...e);
    }
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
                if ("string" != typeof e && (e = Buffer.from(e)), 91 !== e[0] && "[" !== e[0]) return this.emitter.exist("error") ? this.emitter.emit("error", new Error("Received message is not correct structure")) : (this.worker.options.logger.error("Received message is not correct structure"), 
                this.terminate());
                decode(this, JSON.parse(e.toString()));
            } catch (e) {
                if (this.emitter.exist("error")) return this.emitter.emit("error", e);
                this.worker.options.logger.error(e), this.terminate();
            }
        }), this.socket.on("close", (e, s) => {
            this.worker.wss.pubSub.unregister(this.id, Object.keys(this.channels)), this.emitter.emit("disconnect", e, s), 
            this.emitter.removeEvents();
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
    sendRaw(e) {
        this.socket.send(e);
    }
    disconnect(e, s) {
        this.socket.close(e, s);
    }
    terminate() {
        this.socket.terminate();
    }
    subscribe(e) {
        if (!this.channels[e]) {
            if (this.worker.wss.middleware[exports.Middleware.onSubscribe]) return this.worker.wss.middleware[exports.Middleware.onSubscribe](this, e, s => {
                s || (this.channels[e] = !0, this.worker.wss.subscribe(this.id, e));
            });
            this.channels[e] = !0, this.worker.wss.subscribe(this.id, e);
        }
    }
    unsubscribe(e) {
        this.channels[e] && (this.worker.wss.middleware[exports.Middleware.onUnsubscribe] && this.worker.wss.middleware[exports.Middleware.onUnsubscribe](this, e), 
        delete this.channels[e], this.worker.wss.unsubscribe(this.id, e));
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
    return "system" === t ? JSON.stringify(r[t][e]) : JSON.stringify(r[t]);
}

function decode(e, s) {
    const [t, r, o] = s;
    if ("e" === t) return e.emitter.emit(r, o);
    if ("p" === t) return e.channels[r] && e.worker.wss.publish(r, o, e.id);
    if ("s" === t) {
        if ("s" === r) return e.subscribe(o);
        if ("u" === r) return e.unsubscribe(o);
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
    unregister(e, s) {
        for (let t = 0, r = s.length; t < r; t++) this.unsubscribe(s[t], e);
        delete this.users[e];
    }
    subscribe(e, s) {
        return this.users[e] ? this.channels[s] ? this.channels[s].push(e) : (this.hooks.channelAdd && this.hooks.channelAdd(s), 
        void (this.channels[s] = [ "broker", e ])) : this.logger.warning(`Trying to subscribe not existing user ${e}`);
    }
    unsubscribe(e, s) {
        const t = this.channels[s];
        if (t && t.length) {
            const s = t.indexOf(e);
            -1 !== s && t.splice(s, 1);
        }
        t && 1 === t.length && (this.hooks.channelClose && this.hooks.channelClose(s), delete this.channels[s]);
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

class BrokerConnector {
    constructor(e, s) {
        this.options = e, this.createConnections();
    }
    publish(e) {}
    subscribe(e) {}
    unsubscribe(e) {}
    createConnections() {}
}

class WSServer extends EventEmitter {
    constructor(e, s) {
        super(e.logger), this.options = e, this.middleware = {}, this.pubSub = new PubSubEngine(e.logger, 5), 
        this.brokerConnector = new BrokerConnector(e, this.publish.bind(this)), this.pubSub.register("broker", e => {
            this.brokerConnector.publish(e);
        }), this.pubSub.addListener("channelAdd", e => {
            this.brokerConnector.subscribe(e), this.middleware[exports.Middleware.onChannelOpen] && this.middleware[exports.Middleware.onChannelOpen](e);
        }), this.pubSub.addListener("channelClose", e => {
            this.brokerConnector.unsubscribe(e), this.middleware[exports.Middleware.onChannelClose] && this.middleware[exports.Middleware.onChannelClose](e);
        });
    }
    addMiddleware(e, s) {
        this.middleware[e] = s;
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

class Worker {
    constructor(e, s) {
        this.options = e, this.wss = new WSServer(this.options, s), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const t = new cws.WebSocketServer({
            path: this.options.wsPath,
            server: this.server,
            verifyClient: (e, s) => this.wss.middleware[exports.Middleware.verifyConnection] ? this.wss.middleware[exports.Middleware.verifyConnection](e, s) : s(!0)
        });
        t.on("connection", e => {
            this.wss.emit("connection", new Socket(this, e));
        }), this.options.autoPing && t.startAutoPing(this.options.pingInterval, !0), this.server.on("error", e => {
            this.options.logger.error(`Worker ${e.stack || e}`), this.options.mode === exports.Mode.Scale && process.exit();
        }), this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), this.options.mode === exports.Mode.Scale && process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

class BrokerServer {
    constructor(e, s) {
        this.options = e, this.sockets = [], this.server = new cws.WebSocketServer({
            port: s
        }, () => {
            process.send({
                event: "READY",
                pid: process.pid
            });
        }), this.server.on("connection", e => {
            e.id = generateUid(8), e.channels = {}, this.sockets.push(e), this.options.logger.debug(`New connection to broker ${e.id}`), 
            e.on("message", s => "u" === s[0] ? delete e.channels[s.substr(1, s.length - 1)] : "s" === s[0] ? e.channels[s.substr(1, s.length - 1)] = !0 : void this.broadcast(e.id, JSON.parse(s)));
        }), this.server.startAutoPing(2e4);
    }
    broadcast(e, s) {
        const t = Object.keys(s), r = t.length;
        for (let o = 0, i = this.sockets.length; o < i; o++) {
            const i = this.sockets[o];
            if (i.id !== e) {
                let e = !1;
                const o = {};
                for (let n = 0; n < r; n++) {
                    const r = t[n];
                    i.channels[r] && (e = !0, o[r] = s[r]);
                }
                e && i.send(JSON.stringify(o));
            }
        }
    }
}

function runProcesses(e) {
    if (e.mode === exports.Mode.SingleProcess) return e.logger.info(` Running on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
    new Worker(e, "");
    cluster.isMaster ? masterProcess(e) : childProcess(e);
}

function masterProcess(e) {
    let s;
    const t = generateUid(10), r = generateUid(20), o = [], i = [], n = (h, c, l) => {
        const u = cluster.fork();
        u.on("message", t => {
            if (e.logger.debug(`Message from ${c}:`, t), "READY" === t.event) {
                if (l) return e.logger.info(`${c} ${h} PID ${t.pid} has been restarted`);
                if ("Scaler" === c) {
                    s = ` Scaler on: ${e.horizontalScaleOptions.masterOptions.port}, PID ${t.pid}`;
                    for (let s = 0; s < e.brokers; s++) n(s, "Broker");
                }
                if ("Broker" === c && (o[h] = ` Broker on: ${e.brokersPorts[h]}, PID ${t.pid}`, 
                o.length === e.brokers && !o.includes(void 0))) for (let s = 0; s < e.workers; s++) n(s, "Worker");
                "Worker" === c && (i[h] = `    Worker: ${h}, PID ${t.pid}`, i.length !== e.workers || i.includes(void 0) || (e.logger.info(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                s && e.logger.info(s), o.forEach(s => e.logger.info(s)), i.forEach(s => e.logger.info(s))));
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
        switch (e.logger.debug("Message from Master:", s), s.name) {
          case "Worker":
            return new Worker(e, s.securityKey);

          case "Broker":
            return new BrokerServer(e, e.brokersPorts[s.id]);

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

class ClusterWS {
    constructor(e) {
        if (this.options = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            mode: e.mode || exports.Mode.Scale,
            host: e.host,
            logger: e.logger || new Logger(void 0 === e.logLevel ? exports.LogLevel.INFO : e.logLevel),
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
        return cluster.isMaster && this.options.logger.debug("Initialized Options:", this.options), 
        isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? this.options.logger.error("Number of broker ports in not the same as number of brokers") : void runProcesses(this.options) : this.options.logger.error("Worker is not provided or is not a function");
    }
}

exports.ClusterWS = ClusterWS;
