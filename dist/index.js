"use strict";

var crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), clusterwsUws = require("clusterws-uws"), cluster = require("cluster");

function getRandom(e, s) {
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
        this.channels = {}, this.onPublish = ((e, s) => {
            this.send(e, s, "publish");
        }), this.socket.on("message", e => {
            try {
                decode(this, JSON.stringify(e), this.worker.options);
            } catch (e) {
                logError(e);
            }
        }), this.socket.on("close", (e, s) => {
            for (const e in this.channels) this.channels[e] && this.worker.wss.unsubscribe(e, this.id);
            this.emitter.emit("disconnect", e, s), this.emitter.removeEvents();
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
    }, n = JSON.stringify({
        "#": o[t][e] || o[t]
    });
    return r.useBinary ? Buffer.from(n) : n;
}

function decode(e, s, t) {
    let [r, o, n] = s["#"];
    switch ("s" !== r && t.encodeDecodeEngine && (n = t.encodeDecodeEngine.decode(n)), 
    r) {
      case "e":
        return e.emitter.emit(o, n);

      case "p":
        return e.channels[o] && e.worker.wss.publish(o, n, e.id);

      case "s":
        const s = e.channels[n];
        "s" !== o || s || (e.channels[n] = 1, e.worker.wss.subscribe(n, e.id, e.onPublish)), 
        "u" === o && s && (delete e.channels[n], e.worker.wss.unsubscribe(n, e.id));
    }
}

class Channel {
    constructor(e, s, t) {
        this.channelName = e, this.usersIds = [], this.usersListeners = {}, this.messagesBatch = [], 
        this.subscribe(s, t);
    }
    publish(e, s) {
        this.messagesBatch.push({
            id: e,
            message: s
        });
    }
    subscribe(e, s) {
        this.usersIds.push(e), this.usersListeners[e] = s;
    }
    unsubscribe(e) {
        delete this.usersListeners[e], this.usersIds.splice(this.usersIds.indexOf(e), 1), 
        this.usersIds.length || (this.usersIds = [], this.messagesBatch = [], this.usersListeners = {}, 
        this.action("destroy", this.channelName));
    }
    flush() {
        if (this.messagesBatch.length) {
            for (let e = 0, s = this.usersIds.length; e < s; e++) {
                const s = this.usersIds[e], t = [];
                for (let e = 0, r = this.messagesBatch.length; e < r; e++) this.messagesBatch[e].id !== s && t.push(this.messagesBatch[e].message);
                t.length && this.usersListeners[s](this.channelName, t);
            }
            this.messagesBatch = [];
        }
    }
    unfilteredFlush(e) {
        for (let s = 0, t = this.usersIds.length; s < t; s++) {
            const t = this.usersIds[s];
            this.usersListeners[t](e);
        }
    }
    action(e, s) {}
}

class WSServer extends EventEmitter {
    constructor(e) {
        super(), this.options = e, this.channels = {}, this.middleware = {}, this.channelsLoop();
    }
    setMiddleware(e, s) {
        this.middleware[e] = s;
    }
    publish(e, s, t) {
        this.channels[e] && this.channels[e].publish(t, s);
    }
    subscribe(e, s, t) {
        if (this.channels[e]) this.channels[e].subscribe(s, t); else {
            const r = new Channel(e, s, t);
            r.action = this.removeChannel, this.channels[e] = r;
        }
    }
    unsubscribe(e, s) {
        this.channels[e].unsubscribe(s);
    }
    broadcastMessage() {}
    removeChannel(e, s) {
        delete this.channels[s];
    }
    channelsLoop() {
        setTimeout(() => {
            for (const e in this.channels) this.channels[e] && this.channels[e].flush();
            this.channelsLoop();
        }, 10);
    }
}

class Worker {
    constructor(e) {
        this.options = e, this.wss = new WSServer(this.options), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const s = new clusterwsUws.WebSocketServer({
            server: this.server,
            verifyClient: (e, s) => {}
        });
        s.on("connection", e => {
            this.wss.emit("connection", new Socket(this, e));
        }), s.startAutoPing(this.options.pingInterval, !0), this.server.on("error", e => {
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
    const t = [], r = [], o = generateKey(20), n = generateKey(20);
    if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (let s = 0; s < e.brokers; s++) i("Broker", s);
    function i(c, h) {
        const a = cluster.fork();
        a.on("message", o => {
            if ("READY" === o.event) {
                if (s) return logReady(`${c} ${h} PID ${o.pid} has been restarted`);
                switch (c) {
                  case "Broker":
                    if (t[h] = ` Broker on: ${e.brokersPorts[h]}, PID ${o.pid}`, !t.includes(void 0) && t.length === e.brokers) for (let s = 0; s < e.workers; s++) i("Worker", s);
                    break;

                  case "Worker":
                    r[h] = `    Worker: ${h}, PID ${o.pid}`, r.includes(void 0) || r.length !== e.workers || (s = !0, 
                    logReady(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? "(secure)" : ""}`), 
                    t.forEach(logReady), r.forEach(logReady));
                    break;

                  case "Scaler":
                    for (let s = 0; s < e.brokers; s++) i("Broker", s);
                }
            }
        }), a.on("exit", () => {
            logError(`${c} ${h} has exited`), e.restartWorkerOnFail && (logWarning(`${c} ${h} is restarting \n`), 
            i(c, h));
        }), a.send({
            processId: h,
            processName: c,
            serverId: o,
            internalSecurityKey: n
        });
    }
}

function workerProcess(e) {
    process.on("message", s => {
        switch (s.processName) {
          case "Worker":
            return new Worker(e);

          case "Broker":
            process.send({
                event: "READY",
                pid: process.pid
            });
        }
    }), process.on("uncaughtException", e => {
        logError(`${e.stack || e}`), process.exit();
    });
}

class BrokerClient {
    constructor(e, s) {
        this.url = e, this.broadcast = s, this.attempts = 0, this.createSocket();
    }
    createSocket() {
        this.socket = new clusterwsUws.WebSocket(this.url), this.socket.on("open", () => {
            this.attempts = 0, this.attempts > 1 && logReady(`Reconnected to the Broker: ${this.url}`);
        }), this.socket.on("error", e => {
            (this.attempts > 0 && this.attempts % 10 == 0 || 1 === this.attempts) && logWarning(`Can not connect to the Broker: ${this.url} (reconnecting)`), 
            this.socket = null, this.attempts++, setTimeout(() => this.createSocket(), getRandom(1e3, 2e3));
        }), this.socket.on("close", (e, s) => {
            if (this.socket = null, this.attempts++, 1e3 === e) return logWarning(`Disconnected from Broker: ${this.url} (code ${e})`);
            logWarning(`Disconnected from Broker: ${this.url} (reconnecting)`), setTimeout(() => this.createSocket(), getRandom(1e3, 2e3));
        });
    }
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
        return new BrokerClient("ws://localhost:4000", ""), isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? logError("Number of broker ports should be the same as number of brokers") : void (cluster.isMaster ? masterProcess(this.options) : workerProcess(this.options)) : logError("Worker must be provided and it must be a function");
    }
}

module.exports = ClusterWS; module.exports.default = ClusterWS;
