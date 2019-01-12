"use strict";

var Middleware, cluster = require("cluster"), crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), cws = require("@clusterws/cws");

function random(e, s) {
    return Math.floor(Math.random() * (s - e + 1)) + e;
}

function logError(e) {
    return process.stdout.write(`[31mError PID ${process.pid}:[0m  ${e}\n`);
}

function logReady(e) {
    return process.stdout.write(`[32m✓ ${e}[0m\n`);
}

function logWarning(e) {
    return process.stdout.write(`[33mWarning PID ${process.pid}:[0m ${e}\n`);
}

function isFunction(e) {
    return "[object Function]" === {}.toString.call(e);
}

function generateKey(e) {
    return crypto.randomBytes(e).toString("hex");
}

!function(e) {
    e.onSubscribe = "onSubscribe", e.onUnsubscribe = "onUnsubscribe", e.onWorkerMessage = "onWorkerMessage", 
    e.verifyConnection = "verifyConnection";
}(Middleware || (Middleware = {}));

class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(e, s) {
        if (!isFunction(s)) return logError("Listener must be a function");
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
        this.worker = e, this.socket = s, this.id = generateKey(8), this.emitter = new EventEmitter(), 
        this.channels = {}, this.worker.wss.pubSub.register(this.id, e => {
            this.send(null, e, "publish");
        }), this.socket.on("message", e => {
            try {
                "string" != typeof e && (e = Buffer.from(e)), decode(this, JSON.stringify(e), this.worker.options);
            } catch (e) {
                logError(e);
            }
        }), this.socket.on("close", (e, s) => {
            this.worker.wss.pubSub.deRegister(this.id, Object.keys(this.channels)), this.emitter.emit("disconnect", e, s), 
            this.emitter.removeEvents();
        }), this.socket.on("error", e => {
            if (!this.emitter.exist("error")) return logError(e), this.socket.terminate();
            this.emitter.emit("error", e);
        });
    }
    on(e, s) {
        this.emitter.on(e, s);
    }
    send(e, s, t = "emit") {
        this.socket.send(encode(e, s, t, this.worker.options));
    }
    disconnect(e, s) {
        this.socket.close(e, s);
    }
    terminate() {
        this.socket.terminate();
    }
}

function encode(e, s, t, r) {
    "system" === t && r.encodeDecodeEngine && (s = r.encodeDecodeEngine.encode(s));
    const o = {
        emit: [ "e", e, s ],
        publish: [ "p", e, s ],
        system: {
            configuration: [ "s", "c", s ]
        }
    }, n = JSON.stringify(o[t][e] || o[t]);
    return r.useBinary ? Buffer.from(n) : n;
}

function decode(e, s, t) {
    let [r, o, n] = s;
    switch ("s" !== r && t.encodeDecodeEngine && (n = t.encodeDecodeEngine.decode(n)), 
    r) {
      case "e":
        return e.emitter.emit(o, n);

      case "p":
        return e.channels[o] && e.worker.wss.publish(o, n, e.id);

      case "s":
        const s = e.channels[n], i = s => {
            s && (e.channels[n] = 1, e.worker.wss.subscribe(n, e.id));
        };
        "s" !== o || s || (e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe(e, s, i) : i(!0)), 
        "u" === o && s && (e.worker.wss.middleware.onUnsubscribe && e.worker.wss.middleware.onUnsubscribe(e, s), 
        delete e.channels[n], e.worker.wss.unsubscribe(n, e.id));
    }
}

class PubSubEngine {
    constructor(e) {
        this.loopInterval = e, this.hooks = {}, this.changes = [], this.batches = {}, this.registeredUsers = {}, 
        this.registeredChannels = {}, this.loop();
    }
    on(e, s) {
        this.hooks[e] = s;
    }
    getAllChannels() {
        return Object.keys(this.registeredChannels);
    }
    register(e, s) {
        this.registeredUsers[e] = s;
    }
    deRegister(e, s) {
        for (let t = 0, r = s.length; t < r; t++) this.unsubscribe(s[t], e);
        delete this.registeredUsers[e];
    }
    subscribe(e, s) {
        if (this.registeredUsers[s]) {
            if (this.registeredChannels[e]) return this.registeredChannels[e].push(s);
            this.registeredChannels[e] = [ "broker", s ], this.hooks.channelNew && this.hooks.channelNew(e);
        }
    }
    unsubscribe(e, s) {
        const t = this.registeredChannels[e];
        if (!t) return;
        const r = t.indexOf(s);
        -1 !== r && t.splice(r, 1), 1 === t.length && "broker" === t[0] && (delete this.registeredChannels[e], 
        this.hooks.channelRemove && this.hooks.channelRemove(e));
    }
    publish(e, s, t) {
        -1 === this.changes.indexOf(e) && this.changes.push(e);
        const r = this.batches[e];
        if (r) return r.push({
            id: t,
            message: s
        });
        this.batches[e] = [ {
            id: t,
            message: s
        } ];
    }
    flush() {
        if (!this.changes.length) return;
        const e = {};
        for (let s = 0, t = this.changes.length; s < t; s++) {
            const t = this.changes[s], r = this.batches[t];
            if (!r || !r.length) continue;
            const o = r.length, n = this.registeredChannels[t];
            if (n) for (let s = 0, i = n.length; s < i; s++) {
                const i = n[s], c = [];
                for (let e = 0; e < o; e++) r[e].id !== i && c.push(r[e].message);
                c.length && (e[i] || (e[i] = {}), e[i][t] = c);
            } else {
                const s = [];
                for (let e = 0; e < o; e++) s.push(r[e].message);
                e.broker || (e.broker = {}), e.broker[t] = s;
            }
            this.batches[t] = [];
        }
        this.changes = [];
        for (const s in e) e[s] && this.registeredUsers[s] && this.registeredUsers[s](e[s]);
    }
    loop() {
        setTimeout(() => {
            this.flush(), this.loop();
        }, this.loopInterval);
    }
}

class BrokerClient {
    constructor(e) {
        this.url = e, this.events = {}, this.attempts = 0, this.createSocket();
    }
    on(e, s) {
        this.events[e] = s;
    }
    send(e) {
        return this.socket.readyState === this.socket.OPEN && (this.socket.send(e), !0);
    }
    createSocket() {
        this.socket = new cws.WebSocket(this.url), this.socket.on("open", () => {
            this.attempts > 1 && logReady(`Reconnected to the Broker: ${this.url}`), this.events.connect && this.events.connect(), 
            this.attempts = 0;
        }), this.socket.on("error", e => {
            (this.attempts > 0 && this.attempts % 10 == 0 || 1 === this.attempts) && logWarning(`Can not connect to the Broker: ${this.url} (reconnecting)`), 
            this.socket = null, this.attempts++, setTimeout(() => this.createSocket(), random(1e3, 2e3));
        }), this.socket.on("close", (e, s) => {
            if (this.socket = null, this.attempts++, 1e3 === e) return logWarning(`Disconnected from Broker: ${this.url} (code ${e})`);
            logWarning(`Disconnected from Broker: ${this.url} (reconnecting)`), setTimeout(() => this.createSocket(), random(1e3, 2e3));
        }), this.socket.on("message", e => {
            this.events.message && this.events.message(e);
        });
    }
}

class WSServer extends EventEmitter {
    constructor(e, s) {
        super(), this.options = e, this.pubSub = new PubSubEngine(5), this.middleware = {}, 
        this.brokers = [], this.nextBroker = random(0, this.options.brokers - 1), this.pubSub.on("channelNew", e => {
            for (let s = 0, t = this.brokers.length; s < t; s++) this.brokers[s].send(JSON.stringify([ "s", e ]));
        }), this.pubSub.on("channelRemove", e => {
            for (let s = 0, t = this.brokers.length; s < t; s++) this.brokers[s].send(JSON.stringify([ "u", e ]));
        }), this.pubSub.register("broker", e => {
            let s = 0, t = !1;
            const r = Buffer.from(JSON.stringify(e)), o = this.brokers.length;
            for (;!t && s < 2 * o; ) this.nextBroker >= o && (this.nextBroker = 0), t = this.brokers[this.nextBroker].send(r), 
            s++, this.nextBroker++;
        });
        const t = this.onBrokerMessage.bind(this);
        for (let e = 0; e < this.options.brokers; e++) {
            const r = new BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[e]}/?token=${s}`);
            r.on("message", t), r.on("connect", () => {
                const e = this.pubSub.getAllChannels();
                e.length && r.send(JSON.stringify([ "s", e ]));
            }), this.brokers.push(r);
        }
    }
    setMiddleware(e, s) {
        this.middleware[e] = s;
    }
    publish(e, s, t) {
        this.pubSub.publish(e, s, t);
    }
    subscribe(e, s) {
        this.pubSub.subscribe(e, s);
    }
    unsubscribe(e, s) {
        this.unsubscribe(e, s);
    }
    onBrokerMessage(e) {
        const s = JSON.parse(Buffer.from(e));
        for (const e in s) if (s[e]) {
            const t = s[e];
            for (let s = 0, r = t.length; s < r; s++) this.publish(e, t[s], "broker");
        }
    }
}

class Worker {
    constructor(e, s) {
        this.options = e, this.wss = new WSServer(this.options, s), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const t = new cws.WebSocketServer({
            path: this.options.wsPath,
            server: this.server,
            verifyClient: (e, s) => {
                this.wss.middleware.verifyConnection ? this.wss.middleware.verifyConnection(e, s) : s(!0);
            }
        });
        t.on("connection", e => {
            this.wss.emit("connection", new Socket(this, e));
        }), t.startAutoPing(this.options.pingInterval, !0), this.server.on("error", e => {
            logError(`Worker ${e.stack || e}`), process.exit();
        }), this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

class Scaler {
    constructor(e) {
        this.horizontalScaleOptions = e, this.sockets = [];
        const s = {
            verifyClient: (e, s) => {
                s(e.req.url === `/?token=${this.horizontalScaleOptions.key || ""}`);
            }
        };
        e.masterOptions.tlsOptions ? (s.server = HTTPS.createServer(e.masterOptions.tlsOptions), 
        this.server = new cws.WebSocketServer(s), s.server.listen(this.horizontalScaleOptions.masterOptions.port, () => {
            process.send({
                event: "READY",
                pid: process.pid
            });
        })) : (s.port = this.horizontalScaleOptions.masterOptions.port, this.server = new cws.WebSocketServer(s, () => {
            process.send({
                event: "READY",
                pid: process.pid
            });
        })), this.server.on("error", e => {
            logError(`Scaler ${e.stack || e}`), process.exit();
        }), this.server.on("connection", e => {
            e.id = generateKey(8), this.sockets.push(e), e.on("message", s => {
                if ("string" == typeof s) e.serverId = s; else if (e.serverId) for (let t = 0, r = this.sockets.length; t < r; t++) {
                    const r = this.sockets[t];
                    e.serverId !== r.serverId && r.readyState === r.OPEN && r.send(s);
                }
            }), e.on("error", e => {}), e.on("close", (s, t) => {
                for (let s = 0, t = this.sockets.length; s < t; s++) if (this.sockets[s].id === e.id) {
                    this.sockets.splice(s, 1);
                    break;
                }
                e = null;
            });
        }), this.server.startAutoPing(2e4);
    }
}

class Broker {
    constructor(e, s, t, r) {
        this.options = e, this.serverId = r, this.sockets = [], this.scalers = [], this.nextScaler = random(0, this.options.brokers - 1), 
        this.server = new cws.WebSocketServer({
            port: s,
            verifyClient: (e, s) => {
                s(e.req.url === `/?token=${t}`);
            }
        }, () => process.send({
            event: "READY",
            pid: process.pid
        })), this.server.on("error", e => {
            logError(`Broker ${e.stack || e}`), process.exit();
        }), this.server.on("connection", e => {
            e.id = generateKey(8), e.channels = {}, this.sockets.push(e), e.on("message", s => {
                if ("string" == typeof s) {
                    const [t, r] = JSON.parse(s);
                    if ("u" === t) return delete e.channels[r];
                    if ("string" == typeof r) e.channels[r] = 1; else for (let s = 0, t = r.length; s < t; s++) e.channels[r[s]] = 1;
                } else if (this.broadcastMessage(e.id, JSON.parse(Buffer.from(s))), this.options.horizontalScaleOptions) {
                    let e = 0, t = !1;
                    const r = this.scalers.length;
                    for (;!t && e < 2 * r; ) this.nextScaler >= r && (this.nextScaler = 0), t = this.scalers[this.nextScaler].send(s), 
                    e++, this.nextScaler++;
                }
            }), e.on("error", e => {}), e.on("close", (s, t) => {
                e.channels = {};
                for (let s = 0, t = this.sockets.length; s < t; s++) if (this.sockets[s].id === e.id) {
                    this.sockets.splice(s, 1);
                    break;
                }
                e = null;
            });
        }), this.server.startAutoPing(2e4), this.options.horizontalScaleOptions && this.connectScaler(this.options.horizontalScaleOptions);
    }
    connectScaler(e) {
        if (e.masterOptions) {
            const s = `${e.masterOptions.tlsOptions ? "wss" : "ws"}://127.0.0.1:${e.masterOptions.port}`;
            this.scalers.push(this.createClient(s, e.key));
        }
        if (e.brokersUrls) for (let s = 0, t = e.brokersUrls.length; s < t; s++) this.scalers.push(this.createClient(e.brokersUrls[s], e.key));
    }
    createClient(e, s) {
        const t = new BrokerClient(`${e}/?token=${s || ""}`);
        return t.on("connect", () => {
            t.send(this.serverId);
        }), t.on("message", e => {
            this.broadcastMessage(null, JSON.parse(Buffer.from(e)));
        }), t;
    }
    broadcastMessage(e, s) {
        const t = Object.keys(s);
        for (let r = 0, o = this.sockets.length; r < o; r++) {
            const o = this.sockets[r];
            if (o.id !== e) {
                let e = !1;
                const r = {};
                for (let n = 0, i = t.length; n < i; n++) {
                    const i = t[n];
                    o.channels[i] && (e = !0, r[i] = s[i]);
                }
                e && o.readyState === o.OPEN && o.send(Buffer.from(JSON.stringify(r)));
            }
        }
    }
}

function masterProcess(e) {
    let s, t = !1;
    const r = [], o = [], n = generateKey(20), i = generateKey(20);
    if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) c("Scaler", -1); else for (let s = 0; s < e.brokers; s++) c("Broker", s);
    function c(h, l) {
        const a = cluster.fork();
        a.on("message", n => {
            if ("READY" === n.event) {
                if (t) return logReady(`${h} ${l} PID ${n.pid} has been restarted`);
                switch (h) {
                  case "Broker":
                    if (r[l] = ` Broker on: ${e.brokersPorts[l]}, PID ${n.pid}`, !r.includes(void 0) && r.length === e.brokers) for (let s = 0; s < e.workers; s++) c("Worker", s);
                    break;

                  case "Worker":
                    o[l] = `    Worker: ${l}, PID ${n.pid}`, o.includes(void 0) || o.length !== e.workers || (t = !0, 
                    logReady(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                    s && logReady(s), r.forEach(logReady), o.forEach(logReady));
                    break;

                  case "Scaler":
                    s = ` Scaler on: ${e.horizontalScaleOptions.masterOptions.port}, PID ${n.pid}`;
                    for (let s = 0; s < e.brokers; s++) c("Broker", s);
                }
            }
        }), a.on("exit", () => {
            logError(`${h} ${l} has exited`), e.restartWorkerOnFail && (logWarning(`${h} ${l} is restarting \n`), 
            c(h, l));
        }), a.send({
            processId: l,
            processName: h,
            serverId: n,
            internalSecurityKey: i
        });
    }
}

function workerProcess(e) {
    process.on("message", s => {
        switch (s.processName) {
          case "Scaler":
            return new Scaler(e.horizontalScaleOptions);

          case "Worker":
            return new Worker(e, s.internalSecurityKey);

          case "Broker":
            return new Broker(e, e.brokersPorts[s.processId], s.internalSecurityKey, s.serverId);
        }
    }), process.on("uncaughtException", e => {
        logError(`${e.stack || e}`), process.exit();
    });
}

class ClusterWS {
    constructor(e) {
        if (this.options = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            host: e.host,
            worker: e.worker,
            wsPath: e.wsPath || null,
            workers: e.workers || 1,
            brokers: e.brokers || 1,
            useBinary: e.useBinary,
            tlsOptions: e.tlsOptions,
            pingInterval: e.pingInterval || 2e4,
            brokersPorts: e.brokersPorts || [],
            encodeDecodeEngine: e.encodeDecodeEngine,
            restartWorkerOnFail: e.restartWorkerOnFail,
            horizontalScaleOptions: e.horizontalScaleOptions
        }, !this.options.brokersPorts.length) for (let e = 0; e < this.options.brokers; e++) this.options.brokersPorts.push(e + 9400);
        return isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? logError("Number of broker ports should be the same as number of brokers") : void (cluster.isMaster ? masterProcess(this.options) : workerProcess(this.options)) : logError("Worker must be provided and it must be a function");
    }
}

ClusterWS.middleware = Middleware, module.exports = ClusterWS; module.exports.default = ClusterWS;
