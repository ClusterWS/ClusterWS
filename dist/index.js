"use strict";

var crypto = require("crypto"), uws = require("@clusterws/uws"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster");

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

class Broker {
    constructor(e, s, t) {
        this.server = new uws.WebSocketServer({
            port: e,
            verifyClient: (e, s) => s(e.req.url === `/?token=${t}`)
        }, () => process.send({
            event: "READY",
            pid: process.pid
        })), this.server.on("connection", e => {
            e.id = generateKey(10), e.on("message", e => {
                if ("string" == typeof e) {
                    const [s, t] = JSON.parse(e);
                } else {
                    const s = (e = Buffer.from(e)).indexOf(37);
                    e.slice(0, s).toString();
                }
            }), e.on("error", e => {}), e.on("close", (e, s) => {});
        }), this.server.startAutoPing(2e4);
    }
    messagePublisher(e, s, t) {
        e.send(Buffer.from(`${s}%${JSON.stringify(t)}`));
    }
}

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
    removeEvent(e) {
        delete this.events[e];
    }
    removeEvents() {
        this.events = {};
    }
}

class Socket {
    constructor(e, s) {
        this.worker = e, this.socket = s, this.id = generateKey(10), this.emitter = new EventEmitter(), 
        this.channels = {}, this.worker.wss.pubSub.register(this.id, e => {
            this.send(null, e, "publish");
        }), this.socket.on("message", e => {
            try {
                decode(this, JSON.stringify(e), this.worker.options);
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
    }, i = JSON.stringify(o[t][e] || o[t]);
    return r.useBinary ? Buffer.from(i) : i;
}

function decode(e, s, t) {
    let [r, o, i] = s;
    switch ("s" !== r && t.encodeDecodeEngine && (i = t.encodeDecodeEngine.decode(i)), 
    r) {
      case "e":
        return e.emitter.emit(o, i);

      case "p":
        return e.channels[o] && e.worker.wss.publish(o, i, e.id);

      case "s":
        const s = e.channels[i];
        "s" !== o || s || (e.channels[i] = 1, e.worker.wss.subscribe(i, e.id)), "u" === o && s && (delete e.channels[i], 
        e.worker.wss.unsubscribe(i, e.id));
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
            this.registeredChannels[e] = [ s ], this.hooks.channelNew && this.hooks.channelNew(e);
        }
    }
    unsubscribe(e, s) {
        const t = this.registeredChannels[e];
        if (!t) return;
        const r = t.indexOf(s);
        -1 !== r && t.splice(r, 1), t.length || (delete this.registeredChannels[e], this.hooks.channelRemove && this.hooks.channelRemove(e));
    }
    publish(e, s, t) {
        if (!this.registeredChannels[e]) return;
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
            const o = r.length, i = this.registeredChannels[t];
            i.push("broker");
            for (let s = 0, n = i.length; s < n; s++) {
                const n = i[s], c = [];
                for (let e = 0; e < o; e++) r[e].id !== n && c.push(r[e].message);
                c.length && (e[n] || (e[n] = {}), e[n][t] = c);
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
        this.socket = new uws.WebSocket(this.url), this.socket.on("open", () => {
            this.attempts = 0, this.attempts > 1 && logReady(`Reconnected to the Broker: ${this.url}`);
        }), this.socket.on("error", e => {
            (this.attempts > 0 && this.attempts % 10 == 0 || 1 === this.attempts) && logWarning(`Can not connect to the Broker: ${this.url} (reconnecting)`), 
            this.socket = null, this.attempts++, setTimeout(() => this.createSocket(), random(1e3, 2e3));
        }), this.socket.on("close", (e, s) => {
            if (this.socket = null, this.attempts++, 1e3 === e) return logWarning(`Disconnected from Broker: ${this.url} (code ${e})`);
            logWarning(`Disconnected from Broker: ${this.url} (reconnecting)`), setTimeout(() => this.createSocket(), random(1e3, 2e3));
        }), this.socket.on("message", e => {
            const s = this.events.message;
            s && s(e);
        });
    }
}

class WSServer extends EventEmitter {
    constructor(e, s) {
        super(), this.options = e, this.pubSub = new PubSubEngine(10), this.middleware = {}, 
        this.brokers = [], this.nextBrokerId = random(0, this.options.brokers - 1), this.pubSub.register("broker", e => {
            console.log("Message to broker", e);
        });
        const t = this.onBrokerMessage.bind(this);
        for (let e = 0; e < this.options.brokers; e++) {
            const r = new BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[e]}/?token=${s}`);
            r.on("message", t), this.brokers.push(r);
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
    onBrokerMessage(e) {}
}

class Worker {
    constructor(e, s) {
        this.options = e, this.wss = new WSServer(this.options, s), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const t = new uws.WebSocketServer({
            server: this.server
        });
        t.on("connection", e => {
            this.wss.emit("connection", new Socket(this, e));
        }), t.startAutoPing(this.options.pingInterval, !0), this.server.on("error", e => {
            logError(`${e.stack || e}`), process.exit();
        }), this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

function masterProcess(e) {
    let s = !1;
    const t = [], r = [], o = generateKey(20), i = generateKey(20);
    if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) n("Scaler", -1); else for (let s = 0; s < e.brokers; s++) n("Broker", s);
    function n(c, h) {
        const a = cluster.fork();
        a.on("message", o => {
            if ("READY" === o.event) {
                if (s) return logReady(`${c} ${h} PID ${o.pid} has been restarted`);
                switch (c) {
                  case "Broker":
                    if (t[h] = ` Broker on: ${e.brokersPorts[h]}, PID ${o.pid}`, !t.includes(void 0) && t.length === e.brokers) for (let s = 0; s < e.workers; s++) n("Worker", s);
                    break;

                  case "Worker":
                    r[h] = `    Worker: ${h}, PID ${o.pid}`, r.includes(void 0) || r.length !== e.workers || (s = !0, 
                    logReady(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                    t.forEach(logReady), r.forEach(logReady));
                    break;

                  case "Scaler":
                    for (let s = 0; s < e.brokers; s++) n("Broker", s);
                }
            }
        }), a.on("exit", () => {
            logError(`${c} ${h} has exited`), e.restartWorkerOnFail && (logWarning(`${c} ${h} is restarting \n`), 
            n(c, h));
        }), a.send({
            processId: h,
            processName: c,
            serverId: o,
            internalSecurityKey: i
        });
    }
}

function workerProcess(e) {
    process.on("message", s => {
        switch (s.processName) {
          case "Worker":
            return new Worker(e, s.internalSecurityKey);

          case "Broker":
            return new Broker(e.brokersPorts[s.processId], e, s.internalSecurityKey);
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

module.exports = ClusterWS; module.exports.default = ClusterWS;
