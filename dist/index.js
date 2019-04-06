"use strict";

Object.defineProperty(exports, "__esModule", {
    value: !0
});

var cluster = require("cluster"), crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), cws = require("@clusterws/cws");

!function(e) {
    e[e.Scale = 0] = "Scale", e[e.Single = 1] = "Single";
}(exports.Mode || (exports.Mode = {})), function(e) {
    e[e.Default = 0] = "Default", e[e.Redis = 1] = "Redis";
}(exports.Scaler || (exports.Scaler = {})), function(e) {
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

function selectRandomBetween(e, s) {
    return Math.floor(Math.random() * s) + e;
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
    const o = {
        emit: [ "e", e, s ],
        publish: [ "p", e, s ],
        system: {
            configuration: [ "s", "c", s ]
        }
    };
    return "system" === t ? JSON.stringify(o[t][e]) : JSON.stringify(o[t]);
}

function decode(e, s) {
    const [t, o, i] = s;
    if ("e" === t) return e.emitter.emit(o, i);
    if ("p" === t) return e.channels[o] && e.worker.wss.publish(o, i, e.id);
    if ("s" === t) {
        if ("s" === o) return e.subscribe(i);
        if ("u" === o) return e.unsubscribe(i);
    }
}

class PubSubEngine {
    constructor(e, s) {
        this.logger = e, this.interval = s, this.hooks = {}, this.users = {}, this.batches = {}, 
        this.channels = {}, this.run();
    }
    getChannels() {
        return Object.keys(this.channels);
    }
    addListener(e, s) {
        this.hooks[e] = s;
    }
    register(e, s) {
        this.users[e] = s;
    }
    unregister(e, s) {
        this.logger.debug(`Removing ${e} from`, s, "channels", `(pid: ${process.pid})`);
        for (let t = 0, o = s.length; t < o; t++) this.unsubscribe(e, s[t]);
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
        let o = this.batches[e];
        if (o || (this.batches[e] = o = []), s instanceof Array) for (let e = 0, i = s.length; e < i; e++) o.push({
            userId: t,
            message: s[e]
        }); else o.push({
            userId: t,
            message: s
        });
    }
    flush() {
        const e = {};
        for (const s in this.batches) {
            const t = this.channels[s], o = this.batches[s], i = o.length;
            if (t) for (let r = 0, n = t.length; r < n; r++) {
                const n = t[r], c = [];
                for (let e = 0; e < i; e++) o[e].userId !== n && c.push(o[e].message);
                c.length && (e[n] || (e[n] = {}), e[n][s] = c);
            } else {
                const t = [];
                for (let e = 0; e < i; e++) t.push(o[e].message);
                e.broker || (e.broker = {}), e.broker[s] = t;
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

class RedisConnector {
    constructor(e, s, t, o) {
        this.options = e, this.publishFunction = s, this.getChannels = t, this.publisherId = generateUid(8), 
        this.createConnection();
    }
    publish(e) {
        for (const s in e) this.publisher.publish(s, JSON.stringify({
            publisherId: this.publisherId,
            message: e[s]
        }));
    }
    subscribe(e) {
        e && e.length && this.subscriber.subscribe(e);
    }
    unsubscribe(e) {
        e && e.length && (this.options.logger.debug(`Unsubscribing redis client from "${e}"`, `(pid: ${process.pid})`), 
        this.subscriber.unsubscribe(e));
    }
    createConnection() {
        const e = require("redis");
        this.publisher = e.createClient(this.options.scaleOptions.redis), this.subscriber = e.createClient(this.options.scaleOptions.redis), 
        this.publisher.on("ready", () => {
            this.options.logger.debug("Redis Publisher is connected", `(pid: ${process.pid})`);
        }), this.publisher.on("error", e => {
            this.options.logger.error("Redis Publisher error", e.message, `(pid: ${process.pid})`);
        }), this.subscriber.on("error", e => {
            this.options.logger.error("Redis Subscriber error", e.message, `(pid: ${process.pid})`);
        }), this.subscriber.on("ready", () => {
            this.options.logger.debug("Redis Subscriber is connected", `(pid: ${process.pid})`);
        }), this.subscriber.on("message", (e, s) => {
            const t = JSON.parse(s);
            t.publisherId !== this.publisherId && this.publishFunction(e, t.message, "broker");
        });
    }
}

class BrokerConnector {
    constructor(e, s, t, o) {
        this.options = e, this.publishFunction = s, this.getChannels = t, this.next = 0, 
        this.connections = [], this.next = selectRandomBetween(0, this.options.scaleOptions.default.brokers - 1);
        for (let e = 0; e < this.options.scaleOptions.default.brokers; e++) this.createConnection(`ws://127.0.0.1:${this.options.scaleOptions.default.brokersPorts[e]}?key=${o}`);
    }
    publish(e) {
        this.next > this.connections.length && (this.next = 0), this.connections[this.next] && this.connections[this.next].send(JSON.stringify(e)), 
        this.next++;
    }
    subscribe(e) {
        if (e && e.length) {
            this.options.logger.debug(`Subscribing broker client to "${e}"`, `(pid: ${process.pid})`);
            for (let s = 0, t = this.connections.length; s < t; s++) this.connections[s].send(`s${"string" == typeof e ? e : e.join(",")}`);
        }
    }
    unsubscribe(e) {
        if (e && e.length) {
            this.options.logger.debug(`Unsubscribing broker client from "${e}"`, `(pid: ${process.pid})`);
            for (let s = 0, t = this.connections.length; s < t; s++) this.connections[s].send(`u${"string" == typeof e ? e : e.join(",")}`);
        }
    }
    createConnection(e) {
        const s = new cws.WebSocket(e);
        s.on("open", () => {
            s.id = generateUid(8), this.connections.push(s), this.subscribe(this.getChannels()), 
            this.options.logger.debug(`Broker client ${s.id} is connected to ${e}`, `(pid: ${process.pid})`);
        }), s.on("message", e => {
            this.options.logger.debug(`Broker client ${s.id} received:`, e), process.pid, e = JSON.parse(e);
            for (const s in e) this.publishFunction(s, e, "broker");
        }), s.on("close", (t, o) => {
            this.options.logger.debug(`Broker client ${s.id} is disconnected from ${e} code ${t}, reason ${o}`, `(pid: ${process.pid})`);
            for (let e = 0, t = this.connections.length; e < t; e++) this.connections[e].id === s.id && this.connections.splice(e, 1);
            if (1e3 === t) return this.options.logger.warning("Broker connection has been closed");
            setTimeout(() => this.createConnection(e), selectRandomBetween(100, 1e3));
        }), s.on("error", t => {
            this.options.logger.error(`Broker client ${s.id} got error`, t, `(pid: ${process.pid})`), 
            setTimeout(() => this.createConnection(e), selectRandomBetween(100, 1e3));
        });
    }
}

class WSServer extends EventEmitter {
    constructor(e, s) {
        super(e.logger), this.options = e, this.middleware = {}, this.pubSub = new PubSubEngine(this.options.logger, 1e3), 
        this.options.mode !== exports.Mode.Single && (this.options.scaleOptions.scaler === exports.Scaler.Default && (this.connector = new BrokerConnector(this.options, this.publish.bind(this), this.pubSub.getChannels.bind(this.pubSub), s)), 
        this.options.scaleOptions.scaler === exports.Scaler.Redis && (this.connector = new RedisConnector(this.options, this.publish.bind(this), this.pubSub.getChannels.bind(this.pubSub), s))), 
        this.pubSub.register("broker", e => {
            this.options.mode !== exports.Mode.Single && this.connector.publish(e);
        }), this.pubSub.addListener("channelAdd", e => {
            this.options.mode !== exports.Mode.Single && this.connector.subscribe(e), this.middleware[exports.Middleware.onChannelOpen] && this.middleware[exports.Middleware.onChannelOpen](e);
        }), this.pubSub.addListener("channelClose", e => {
            this.options.mode !== exports.Mode.Single && this.connector.unsubscribe(e), this.middleware[exports.Middleware.onChannelClose] && this.middleware[exports.Middleware.onChannelClose](e);
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
            path: this.options.websocketOptions.wsPath,
            server: this.server,
            verifyClient: (e, s) => this.wss.middleware[exports.Middleware.verifyConnection] ? this.wss.middleware[exports.Middleware.verifyConnection](e, s) : s(!0)
        });
        t.on("connection", e => {
            this.options.logger.debug("New WebSocket client is connected", `(pid: ${process.pid})`), 
            this.wss.emit("connection", new Socket(this, e));
        }), this.options.websocketOptions.autoPing && t.startAutoPing(this.options.websocketOptions.pingInterval, !0), 
        this.server.on("error", e => {
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
            e.id = generateUid(8), e.channels = {}, this.sockets.push(e), this.options.logger.debug(`New connection to broker ${e.id}`, `(pid: ${process.pid})`), 
            e.on("message", s => {
                if (this.options.logger.debug("Broker received", s, `(pid: ${process.pid})`), "u" === s[0]) {
                    const t = s.substr(1, s.length - 1).split(",");
                    for (let s = 0, o = t.length; s < o; s++) delete e.channels[t[s]];
                } else if ("s" === s[0]) {
                    const t = s.substr(1, s.length - 1).split(",");
                    for (let s = 0, o = t.length; s < o; s++) e.channels[t[s]] = !0;
                } else this.broadcast(e.id, JSON.parse(s));
            });
        }), this.server.startAutoPing(2e4);
    }
    broadcast(e, s) {
        const t = Object.keys(s), o = t.length;
        for (let i = 0, r = this.sockets.length; i < r; i++) {
            const r = this.sockets[i];
            if (r.id !== e) {
                let e = !1;
                const i = {};
                for (let n = 0; n < o; n++) {
                    const o = t[n];
                    r.channels[o] && (e = !0, i[o] = s[o]);
                }
                e && r.send(JSON.stringify(i));
            }
        }
    }
}

function runProcesses(e) {
    if (e.mode === exports.Mode.Single) return e.logger.info(` Running on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
    new Worker(e, "");
    cluster.isMaster ? masterProcess(e) : childProcess(e);
}

function masterProcess(e) {
    let s;
    const t = generateUid(10), o = generateUid(20), i = [], r = [], n = (c, l, h) => {
        const p = cluster.fork();
        p.on("message", t => {
            if (e.logger.debug(`Message from ${l}:`, t, `(pid: ${process.pid})`), "READY" === t.event) {
                if (h) return e.logger.info(`${l} ${c} PID ${t.pid} has been restarted`);
                if ("Scaler" === l) {
                    s = ` Scaler on: ${e.scaleOptions.default.horizontalScaleOptions.masterOptions.port}, PID ${t.pid}`;
                    for (let s = 0; s < e.scaleOptions.default.brokers; s++) n(s, "Broker");
                }
                if ("Broker" === l && (i[c] = ` Broker on: ${e.scaleOptions.default.brokersPorts[c]}, PID ${t.pid}`, 
                i.length === e.scaleOptions.default.brokers && !i.includes(void 0))) for (let s = 0; s < e.scaleOptions.workers; s++) n(s, "Worker");
                "Worker" === l && (r[c] = `    Worker: ${c}, PID ${t.pid}`, r.length !== e.scaleOptions.workers || r.includes(void 0) || (e.logger.info(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                s && e.logger.info(s), e.scaleOptions.scaler === exports.Scaler.Default && i.forEach(s => e.logger.info(s)), 
                r.forEach(s => e.logger.info(s))));
            }
        }), p.on("exit", () => {
            e.logger.error(`${l} ${c} has exited`);
        }), p.send({
            id: c,
            name: l,
            serverId: t,
            securityKey: o
        });
    };
    if (e.scaleOptions.scaler === exports.Scaler.Default) for (let s = 0; s < e.scaleOptions.default.brokers; s++) n(s, "Broker"); else for (let s = 0; s < e.scaleOptions.workers; s++) n(s, "Worker");
}

function childProcess(e) {
    process.on("message", s => {
        switch (e.logger.debug("Message from Master:", s, `(pid: ${process.pid})`), s.name) {
          case "Worker":
            return new Worker(e, s.securityKey);

          case "Broker":
            return new BrokerServer(e, e.scaleOptions.default.brokersPorts[s.id]);

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
            logger: e.loggerOptions && e.loggerOptions.logger ? e.loggerOptions.logger : new Logger(e.loggerOptions && void 0 !== e.loggerOptions.logLevel ? e.loggerOptions.logLevel : exports.LogLevel.INFO),
            worker: e.worker,
            tlsOptions: e.tlsOptions,
            websocketOptions: {
                wsPath: e.websocketOptions ? e.websocketOptions.wsPath : null,
                autoPing: !e.websocketOptions || !1 !== e.websocketOptions.autoPing,
                pingInterval: e.websocketOptions && e.websocketOptions.pingInterval ? e.websocketOptions.pingInterval : 2e4
            },
            scaleOptions: {
                scaler: e.scaleOptions && e.scaleOptions.scaler ? e.scaleOptions.scaler : exports.Scaler.Default,
                workers: e.scaleOptions && e.scaleOptions.workers ? e.scaleOptions.workers : 1,
                redis: e.scaleOptions && e.scaleOptions.redis ? e.scaleOptions.redis : null,
                default: {
                    brokers: e.scaleOptions && e.scaleOptions.default && e.scaleOptions.default.brokers ? e.scaleOptions.default.brokers : 1,
                    brokersPorts: e.scaleOptions && e.scaleOptions.default && e.scaleOptions.default.brokersPorts ? e.scaleOptions.default.brokersPorts : [],
                    horizontalScaleOptions: null
                }
            }
        }, !this.options.scaleOptions.default.brokersPorts.length) for (let e = 0; e < this.options.scaleOptions.default.brokers; e++) this.options.scaleOptions.default.brokersPorts.push(e + 9400);
        return cluster.isMaster && this.options.logger.debug("Initialized Options:", this.options, `(pid: ${process.pid})`), 
        isFunction(this.options.worker) ? this.options.scaleOptions.default.brokers !== this.options.scaleOptions.default.brokersPorts.length ? this.options.logger.error("Number of broker ports in not the same as number of brokers") : void runProcesses(this.options) : this.options.logger.error("Worker is not provided or is not a function");
    }
}

exports.ClusterWS = ClusterWS;
