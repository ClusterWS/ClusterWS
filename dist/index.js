"use strict";

Object.defineProperty(exports, "__esModule", {
    value: !0
});

var cluster = require("cluster"), crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https");

!function(e) {
    e[e.Scale = 0] = "Scale", e[e.Single = 1] = "Single";
}(exports.Mode || (exports.Mode = {})), function(e) {
    e[e.Default = 0] = "Default", e[e.Redis = 1] = "Redis";
}(exports.Scaler || (exports.Scaler = {})), function(e) {
    e[e.onSubscribe = 0] = "onSubscribe", e[e.onUnsubscribe = 1] = "onUnsubscribe", 
    e[e.verifyConnection = 2] = "verifyConnection", e[e.onChannelOpen = 3] = "onChannelOpen", 
    e[e.onChannelClose = 4] = "onChannelClose", e[e.onMessageFromWorker = 5] = "onMessageFromWorker";
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
    return "function" == typeof e;
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

function encode(e, s, t) {
    const o = {
        emit: [ "e", e, s ],
        publish: [ "p", e, s ],
        system: {
            subscribe: [ "s", "s", s ],
            configuration: [ "s", "c", s ]
        }
    };
    return "system" === t ? JSON.stringify(o[t][e]) : JSON.stringify(o[t]);
}

function decode(e, s) {
    const [t, o, i] = s;
    if ("e" === t) return e.emitter.emit(o, i);
    if ("p" === t) return e.channels[o] && e.worker.wss.publish(o, i, null);
    if ("s" === t) {
        if ("s" === o) return e.subscribe(i);
        if ("u" === o) return e.unsubscribe(i);
    }
}

class Socket {
    constructor(e, s) {
        if (this.worker = e, this.socket = s, this.id = generateUid(8), this.channels = {}, 
        this.emitter = new EventEmitter(this.worker.options.logger), this.worker.options.websocketOptions.sendConfigurationMessage) {
            const e = {
                autoPing: this.worker.options.websocketOptions.autoPing,
                pingInterval: this.worker.options.websocketOptions.pingInterval
            };
            this.send("configuration", e, "system");
        }
        this.worker.wss.pubSub.register(this.id, e => {
            this.send(null, e, "publish");
        }), this.socket.on("pong", () => {
            this.emitter.emit("pong");
        }), this.socket.on("message", e => {
            if (this.emitter.exist("message")) return this.emitter.emit("message", e);
            this.processMessage(e);
        }), this.socket.on("close", (e, s) => {
            this.worker.wss.pubSub.unregister(this.id, Object.keys(this.channels)), this.emitter.emit("close", e, s), 
            this.emitter.removeEvents(), this.channels = {};
        }), this.socket.on("error", e => {
            if (this.emitter.exist("error")) return this.emitter.emit("error", e);
            this.worker.options.logger.error(e), this.socket.terminate();
        });
    }
    get readyState() {
        return this.socket.readyState;
    }
    on(e, s) {
        this.emitter.on(e, s);
    }
    send(e, s, t = "emit") {
        return void 0 === s ? this.socket.send(e) : this.socket.send(encode(e, s, t));
    }
    close(e, s) {
        this.socket.close(e, s);
    }
    terminate() {
        this.socket.terminate();
    }
    subscribe(e) {
        const s = {};
        for (let t = 0, o = e.length; t < o; t++) {
            const o = e[t];
            s[o] = !0, this.channels[o] ? s[o] = !1 : this.worker.wss.middleware[exports.Middleware.onSubscribe] ? this.worker.wss.middleware[exports.Middleware.onSubscribe](this, o, e => {
                e ? (this.channels[o] = !0, this.worker.wss.subscribe(this.id, o)) : s[o] = !1;
            }) : (this.channels[o] = !0, this.worker.wss.subscribe(this.id, o));
        }
        this.send("subscribe", s, "system");
    }
    unsubscribe(e) {
        this.channels[e] && (this.worker.wss.middleware[exports.Middleware.onUnsubscribe] && this.worker.wss.middleware[exports.Middleware.onUnsubscribe](this, e), 
        delete this.channels[e], this.worker.wss.unsubscribe(this.id, e));
    }
    processMessage(e) {
        try {
            if (e instanceof Array) return decode(this, e);
            if ("string" != typeof e && (e = Buffer.from(e)), 91 !== e[0] && "[" !== e[0]) {
                const e = new Error("processMessage received incorrect message");
                if (this.emitter.exist("error")) return this.emitter.emit("error", e);
                throw e;
            }
            decode(this, JSON.parse(e.toString()));
        } catch (e) {
            if (this.emitter.exist("error")) return this.emitter.emit("error", e);
            this.worker.options.logger.error(e), this.terminate();
        }
    }
}

class PubSubEngine {
    constructor(e, s, t = {}) {
        this.logger = e, this.interval = s, this.hooks = {}, this.users = {}, this.batches = {}, 
        this.channels = {}, this.run(), this.channels = t;
    }
    addListener(e, s) {
        this.hooks[e] = s;
    }
    getChannels() {
        return Object.keys(this.channels);
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
        void (this.channels[s] = [ "#broker", e ])) : this.logger.warning(`Trying to subscribe not existing user ${e}`);
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
                e["#broker"] || (e["#broker"] = {}), e["#broker"][s] = t;
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
        }), this.subscriber.on("ready", () => {
            this.options.logger.debug("Redis Subscriber is connected", `(pid: ${process.pid})`), 
            this.subscribe(this.getChannels());
        }), this.publisher.on("error", e => {
            this.options.logger.error("Redis Publisher error", e.message, `(pid: ${process.pid})`);
        }), this.subscriber.on("error", e => {
            this.options.logger.error("Redis Subscriber error", e.message, `(pid: ${process.pid})`);
        }), this.subscriber.on("message", (e, s) => {
            const t = JSON.parse(s);
            t.publisherId !== this.publisherId && this.publishFunction(e, t.message, "#broker");
        });
    }
}

const PING = new Uint8Array([ "9".charCodeAt(0) ]).buffer;

class WebSocketEngine {
    static createWebsocketClient(e, s) {
        return "ws" === e ? new (require("ws"))(s) : new (require("@clusterws/cws").WebSocket)(s);
    }
    static createWebsocketServer(e, s, t) {
        if ("ws" === e) {
            const e = () => {}, o = new (require("ws").Server)(s, t);
            return o._on = o.on.bind(o), o._connectionListener = e, o.on = ((e, s) => ("connection" === e && (o._connectionListener = s), 
            o._on(e, s))), o._on("connection", (s, t) => {
                s._on = s.on.bind(s), s._pongListener = e, s._messageListener = e, s.on = ((e, t) => "pong" === e ? s._pongListener = t : "message" === e ? s._messageListener = t : s._on(e, t)), 
                s._on("message", e => {
                    if ("string" != typeof e && 1 === e.length && 65 === e[0]) return s.isAlive = !0, 
                    s._pongListener();
                    s._messageListener(e);
                }), s._on("pong", () => {
                    s.isAlive = !0, s._pongListener();
                });
            }), o.startAutoPing = ((s, t) => {
                setInterval(function() {
                    o.clients.forEach(function(s) {
                        return !1 === s.isAlive ? s.terminate() : (s.isAlive = !1, t ? s.send(PING) : s.ping(e));
                    });
                }, s);
            }), o;
        }
        return new (require("@clusterws/cws").WebSocketServer)(s, t);
    }
}

class BrokerConnector {
    constructor(e, s, t, o) {
        this.options = e, this.publishFunction = s, this.getChannels = t, this.next = 0, 
        this.connections = [], this.next = selectRandomBetween(0, this.options.scaleOptions.default.brokers - 1);
        for (let e = 0; e < this.options.scaleOptions.default.brokers; e++) this.createConnection(`ws://127.0.0.1:${this.options.scaleOptions.default.brokersPorts[e]}/?key=${o}`);
    }
    publish(e) {
        this.next > this.connections.length - 1 && (this.next = 0), this.connections[this.next] && this.connections[this.next].send(JSON.stringify(e)), 
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
        const s = WebSocketEngine.createWebsocketClient(this.options.websocketOptions.engine, e);
        s.on("open", () => {
            s.id = generateUid(8), this.connections.push(s), this.subscribe(this.getChannels()), 
            this.options.logger.debug(`Broker client ${s.id} is connected to ${e}`, `(pid: ${process.pid})`);
        }), s.on("message", e => {
            this.options.logger.debug(`Broker client ${s.id} received:`, e), process.pid, e = JSON.parse(e);
            for (const s in e) this.publishFunction(s, e[s], "#broker");
        }), s.on("close", (t, o) => {
            if (this.options.logger.debug(`Broker client ${s.id} is disconnected from ${e} code ${t}, reason ${o}`, `(pid: ${process.pid})`), 
            this.removeSocketById(s.id), 1e3 === t) return this.options.logger.warning(`Broker client ${s.id} has been closed clean`);
            this.options.logger.warning(`Broker client ${s.id} has been closed, now is reconnecting`), 
            setTimeout(() => this.createConnection(e), selectRandomBetween(100, 1e3));
        }), s.on("error", t => {
            this.options.logger.error(`Broker client ${s.id} got error`, t, "now is reconnecting", `(pid: ${process.pid})`), 
            this.removeSocketById(s.id), setTimeout(() => this.createConnection(e), selectRandomBetween(100, 1e3));
        });
    }
    removeSocketById(e) {
        for (let s = 0, t = this.connections.length; s < t; s++) if (this.connections[s].id === e) {
            this.connections.splice(s, 1);
            break;
        }
    }
}

class WSServer extends EventEmitter {
    constructor(e, s) {
        super(e.logger), this.options = e, this.middleware = {}, this.pubSub = new PubSubEngine(this.options.logger, 5, {
            "#workersLine": [ "#broker", "#worker" ]
        }), this.options.mode !== exports.Mode.Single && (this.options.scaleOptions.scaler === exports.Scaler.Default && (this.connector = new BrokerConnector(this.options, this.publish.bind(this), this.pubSub.getChannels.bind(this.pubSub), s)), 
        this.options.scaleOptions.scaler === exports.Scaler.Redis && (this.connector = new RedisConnector(this.options, this.publish.bind(this), this.pubSub.getChannels.bind(this.pubSub), s))), 
        this.pubSub.register("#worker", e => {
            if (this.middleware[exports.Middleware.onMessageFromWorker]) {
                const s = e["#workersLine"];
                for (let e = 0, t = s.length; e < t; e++) this.middleware[exports.Middleware.onMessageFromWorker](s[e]);
            }
        }), this.pubSub.register("#broker", e => {
            this.options.mode !== exports.Mode.Single && this.connector.publish(e);
        }), this.pubSub.addListener("channelAdd", e => {
            this.options.mode !== exports.Mode.Single && this.connector.subscribe(e), this.middleware[exports.Middleware.onChannelOpen] && this.middleware[exports.Middleware.onChannelOpen](e);
        }), this.pubSub.addListener("channelClose", e => {
            this.options.mode !== exports.Mode.Single && this.connector.unsubscribe(e), this.middleware[exports.Middleware.onChannelClose] && this.middleware[exports.Middleware.onChannelClose](e);
        });
    }
    publishToWorkers(e) {
        this.publish("#workersLine", e, "#worker");
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
        const t = WebSocketEngine.createWebsocketServer(this.options.websocketOptions.engine, {
            path: this.options.websocketOptions.wsPath,
            server: this.server,
            verifyClient: (e, s) => this.wss.middleware[exports.Middleware.verifyConnection] ? this.wss.middleware[exports.Middleware.verifyConnection](e, s) : s(!0)
        });
        t.on("connection", (e, s) => {
            this.options.logger.debug("New WebSocket client is connected", `(pid: ${process.pid})`), 
            this.wss.emit("connection", new Socket(this, e), s);
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

class ScalerConnector {
    constructor(e, s, t) {
        this.options = e, this.publishFunction = s, this.serverId = t, this.next = 0, this.connections = [];
        const o = this.options.scaleOptions.default.horizontalScaleOptions;
        if (o.masterOptions) {
            const e = o.masterOptions.tlsOptions ? "wss" : "ws";
            this.createConnection(`${e}://127.0.0.1:${o.masterOptions.port}/?key=${o.key || ""}`);
        }
        if (o.scalersUrls) for (let e = 0, s = o.scalersUrls.length; e < s; e++) this.createConnection(`${o.scalersUrls[e]}/?key=${o.key || ""}`);
    }
    publish(e) {
        this.next > this.connections.length - 1 && (this.next = 0), this.connections[this.next] && this.connections[this.next].send(e), 
        this.next++;
    }
    createConnection(e) {
        const s = WebSocketEngine.createWebsocketClient(this.options.websocketOptions.engine, e);
        s.on("open", () => {
            s.id = generateUid(8), s.send("i" + this.serverId), this.connections.push(s), this.options.logger.debug(`Scaler client ${s.id} is connected to ${e}`, `(pid: ${process.pid})`);
        }), s.on("message", e => {
            this.options.logger.debug(`Scaler client ${s.id} received:`, e), process.pid, this.publishFunction(e);
        }), s.on("close", (t, o) => {
            if (this.options.logger.debug(`Scaler client ${s.id} is disconnected from ${e} code ${t}, reason ${o}`, `(pid: ${process.pid})`), 
            this.removeSocketById(s.id), 1e3 === t) return this.options.logger.warning(`Scaler client ${s.id} has been closed clean`);
            this.options.logger.warning(`Scaler client ${s.id} has been closed, now is reconnecting`), 
            setTimeout(() => this.createConnection(e), selectRandomBetween(100, 1e3));
        }), s.on("error", t => {
            this.options.logger.error(`Scaler client ${s.id} got error`, t, "now is reconnecting", `(pid: ${process.pid})`), 
            this.removeSocketById(s.id), setTimeout(() => this.createConnection(e), selectRandomBetween(100, 1e3));
        });
    }
    removeSocketById(e) {
        for (let s = 0, t = this.connections.length; s < t; s++) if (this.connections[s].id === e) {
            this.connections.splice(s, 1);
            break;
        }
    }
}

class BrokerServer {
    constructor(e, s, t, o) {
        this.options = e, this.sockets = [], this.streamToScaler = !1, this.server = WebSocketEngine.createWebsocketServer(this.options.websocketOptions.engine, {
            port: s,
            verifyClient: (e, s) => s(e.req.url === `/?key=${t}`)
        }, () => process.send({
            event: "READY",
            pid: process.pid
        })), this.options.scaleOptions.default.horizontalScaleOptions && (this.streamToScaler = !0, 
        this.scaler = new ScalerConnector(this.options, e => {
            this.broadcast(null, JSON.parse(e));
        }, o)), this.server.on("error", e => {
            this.options.logger.error("Broker Server got an error", e.stack || e), process.exit();
        }), this.server.on("connection", e => {
            e.id = generateUid(8), e.channels = {}, this.sockets.push(e), this.options.logger.debug(`New connection to broker ${e.id}`, `(pid: ${process.pid})`), 
            e.on("message", s => {
                if (this.options.logger.debug("Broker received", s, `(pid: ${process.pid})`), "u" === s[0]) {
                    const t = s.substr(1, s.length - 1).split(",");
                    for (let s = 0, o = t.length; s < o; s++) delete e.channels[t[s]];
                } else if ("s" === s[0]) {
                    const t = s.substr(1, s.length - 1).split(",");
                    for (let s = 0, o = t.length; s < o; s++) e.channels[t[s]] = !0;
                } else this.broadcast(e.id, JSON.parse(s)), this.streamToScaler && (this.options.logger.debug("Sending message to Scaler"), 
                this.scaler.publish(s));
            }), e.on("close", (s, t) => {
                e.channels = {}, this.removeSocketById(e.id);
            }), e.on("error", s => {
                e.channels = {}, this.removeSocketById(e.id);
            });
        }), this.server.startAutoPing(2e4);
    }
    removeSocketById(e) {
        for (let s = 0, t = this.sockets.length; s < t; s++) if (this.sockets[s].id === e) {
            this.sockets.splice(s, 1);
            break;
        }
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

class ScalerServer {
    constructor(e) {
        this.options = e, this.sockets = [];
        const s = this.options.scaleOptions.default.horizontalScaleOptions, t = s.masterOptions.tlsOptions ? HTTPS.createServer(s.masterOptions.tlsOptions) : HTTP.createServer();
        this.wsServer = WebSocketEngine.createWebsocketServer(this.options.websocketOptions.engine, {
            server: t,
            verifyClient: (e, t) => {
                t(e.req.url === `/?key=${s.key || ""}`);
            }
        }), t.listen(s.masterOptions.port, () => {
            process.send({
                event: "READY",
                pid: process.pid
            });
        }), this.wsServer.on("error", e => {
            this.options.logger.error(`Scaler error ${e.stack || e}`), process.exit();
        }), this.wsServer.on("connection", e => {
            e.id = generateUid(8), this.sockets.push(e), e.on("message", s => {
                if ("i" === s[0]) e.serverId = s; else if (e.serverId) for (let t = 0, o = this.sockets.length; t < o; t++) {
                    const o = this.sockets[t];
                    o.serverId && e.serverId !== o.serverId && o.send(s);
                }
            }), e.on("close", (s, t) => {
                this.removeSocketById(e.id);
            }), e.on("error", s => {
                this.removeSocketById(e.id);
            });
        }), this.wsServer.startAutoPing(2e4);
    }
    removeSocketById(e) {
        for (let s = 0, t = this.sockets.length; s < t; s++) if (this.sockets[s].id === e) {
            this.sockets.splice(s, 1);
            break;
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
        const a = cluster.fork();
        a.on("message", t => {
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
        }), a.on("exit", () => {
            e.logger.error(`${l} ${c} has exited`), e.scaleOptions.restartOnFail && (e.logger.warning(`${l} ${c} is restarting \n`), 
            n(c, l, !0));
        }), a.send({
            id: c,
            name: l,
            serverId: t,
            securityKey: o
        });
    };
    if (e.scaleOptions.scaler === exports.Scaler.Default) if (e.scaleOptions.default.horizontalScaleOptions && e.scaleOptions.default.horizontalScaleOptions.masterOptions) n(-1, "Scaler"); else for (let s = 0; s < e.scaleOptions.default.brokers; s++) n(s, "Broker"); else for (let s = 0; s < e.scaleOptions.workers; s++) n(s, "Worker");
}

function childProcess(e) {
    process.on("message", s => {
        switch (e.logger.debug("Message from Master:", s, `(pid: ${process.pid})`), s.name) {
          case "Worker":
            return new Worker(e, s.securityKey);

          case "Broker":
            return new BrokerServer(e, e.scaleOptions.default.brokersPorts[s.id], s.securityKey, s.serverId);

          case "Scaler":
            return new ScalerServer(e);

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
            logger: e.loggerOptions && e.loggerOptions.logger ? e.loggerOptions.logger : new Logger(e.loggerOptions && e.loggerOptions.logLevel ? e.loggerOptions.logLevel : exports.LogLevel.INFO),
            worker: e.worker,
            tlsOptions: e.tlsOptions,
            websocketOptions: {
                engine: e.websocketOptions && e.websocketOptions.engine || "@clusterws/cws",
                wsPath: e.websocketOptions ? e.websocketOptions.wsPath : null,
                autoPing: !e.websocketOptions || !1 !== e.websocketOptions.autoPing,
                pingInterval: e.websocketOptions && e.websocketOptions.pingInterval || 2e4,
                sendConfigurationMessage: !e.websocketOptions || !1 !== e.websocketOptions.sendConfigurationMessage || e.websocketOptions.sendConfigurationMessage
            },
            scaleOptions: {
                restartOnFail: !!e.scaleOptions && e.scaleOptions.restartOnFail,
                scaler: e.scaleOptions && e.scaleOptions.scaler ? e.scaleOptions.scaler : exports.Scaler.Default,
                workers: e.scaleOptions && e.scaleOptions.workers ? e.scaleOptions.workers : 1,
                redis: e.scaleOptions && e.scaleOptions.redis ? e.scaleOptions.redis : null,
                default: {
                    brokers: e.scaleOptions && e.scaleOptions.default && e.scaleOptions.default.brokers ? e.scaleOptions.default.brokers : 1,
                    brokersPorts: e.scaleOptions && e.scaleOptions.default && e.scaleOptions.default.brokersPorts ? e.scaleOptions.default.brokersPorts : [],
                    horizontalScaleOptions: e.scaleOptions && e.scaleOptions.default ? e.scaleOptions.default.horizontalScaleOptions : null
                }
            }
        }, !this.options.scaleOptions.default.brokersPorts.length) for (let e = 0; e < this.options.scaleOptions.default.brokers; e++) this.options.scaleOptions.default.brokersPorts.push(e + 9400);
        return cluster.isMaster && this.options.logger.debug("Initialized Options:", this.options, `(pid: ${process.pid})`), 
        isFunction(this.options.worker) ? this.options.scaleOptions.default.brokers !== this.options.scaleOptions.default.brokersPorts.length ? this.options.logger.error("Number of broker ports in not the same as number of brokers") : void runProcesses(this.options) : this.options.logger.error("Worker is not provided or is not a function");
    }
}

exports.ClusterWS = ClusterWS;
