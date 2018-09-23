"use strict";

var crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), clusterwsUws = require("clusterws-uws"), cluster = require("cluster");

function logError(s) {
    return process.stdout.write(`[31mError PID ${process.pid}:[0m  ${s}\n`);
}

function logReady(s) {
    return process.stdout.write(`[32m✓ ${s}[0m\n`);
}

function logWarning(s) {
    return process.stdout.write(`[33mWarning PID ${process.pid}:[0m ${s}\n`);
}

function isFunction(s) {
    return "[object Function]" === {}.toString.call(s);
}

function generateKey(s) {
    return crypto.randomBytes(s).toString("hex");
}

class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(s, e) {
        if (!isFunction(e)) return logError("Listener must be a function");
        this.events[s] = e;
    }
    emit(s, ...e) {
        const t = this.events[s];
        t && t(...e);
    }
    exist(s) {
        return !!this.events[s];
    }
    removeEvent(s) {
        delete this.events[s];
    }
    removeEvents() {
        this.events = {};
    }
}

class Socket {
    constructor(s, e) {
        this.worker = s, this.socket = e, this.id = generateKey(10), this.emitter = new EventEmitter(), 
        this.channels = {}, this.onPublish = ((s, e) => {
            this.send(s, e, "publish");
        }), this.socket.on("message", s => {
            try {
                decode(this, JSON.stringify(s), this.worker.options);
            } catch (s) {
                logError(s);
            }
        }), this.socket.on("close", (s, e) => {
            for (const s in this.channels) this.channels[s] && this.worker.wss.unsubscribe(s, this.id);
            this.emitter.emit("disconnect", s, e), this.emitter.removeEvents();
        }), this.socket.on("error", s => {
            if (!this.emitter.exist("error")) return logError(s), this.socket.terminate();
            this.emitter.emit("error", s);
        });
    }
    on(s, e) {
        this.emitter.on(s, e);
    }
    send(s, e, t = "emit") {
        this.socket.send(encode(s, e, t, this.worker.options));
    }
    disconnect(s, e) {
        this.socket.close(s, e);
    }
    terminate() {
        this.socket.terminate();
    }
}

function encode(s, e, t, r) {
    "system" === t && r.encodeDecodeEngine && (e = r.encodeDecodeEngine.encode(e));
    const o = {
        emit: [ "e", s, e ],
        publish: [ "p", s, e ],
        system: {
            configuration: [ "s", "c", e ]
        }
    }, i = JSON.stringify({
        "#": o[t][s] || o[t]
    });
    return r.useBinary ? Buffer.from(i) : i;
}

function decode(s, e, t) {
    let [r, o, i] = e["#"];
    switch ("s" !== r && t.encodeDecodeEngine && (i = t.encodeDecodeEngine.decode(i)), 
    r) {
      case "e":
        return s.emitter.emit(o, i);

      case "p":
        return s.channels[o] && s.worker.wss.publish(o, i, s.id);

      case "s":
        const e = s.channels[i];
        "s" !== o || e || (s.channels[i] = 1, s.worker.wss.subscribe(i, s.id, s.onPublish)), 
        "u" === o && e && (delete s.channels[i], s.worker.wss.unsubscribe(i, s.id));
    }
}

class Room {
    constructor(s, e, t) {
        this.roomName = s, this.usersIds = [], this.usersListeners = {}, this.messagesBatch = [], 
        this.subscribe(e, t);
    }
    publish(s, e) {
        this.messagesBatch.push({
            id: s,
            message: e
        });
    }
    subscribe(s, e) {
        this.usersIds.push(s), this.usersListeners[s] = e;
    }
    unsubscribe(s) {
        delete this.usersListeners[s], this.usersIds.splice(this.usersIds.indexOf(s), 1), 
        this.usersIds.length || (this.usersIds = [], this.messagesBatch = [], this.usersListeners = {}, 
        this.action("destroy", this.roomName));
    }
    flush() {
        if (this.messagesBatch.length) {
            for (let s = 0, e = this.usersIds.length; s < e; s++) {
                const e = this.usersIds[s], t = [];
                for (let s = 0, r = this.messagesBatch.length; s < r; s++) this.messagesBatch[s].id !== e && t.push(this.messagesBatch[s].message);
                this.usersListeners[e](this.roomName, t);
            }
            this.messagesBatch = [];
        }
    }
    unfilteredFlush(s) {
        for (let e = 0, t = this.usersIds.length; e < t; e++) {
            const t = this.usersIds[e];
            this.usersListeners[t](s);
        }
    }
    action(s, e) {}
}

class WSServer extends EventEmitter {
    constructor(s) {
        super(), this.options = s, this.channels = {}, this.middleware = {}, this.roomLoop();
    }
    setMiddleware(s, e) {
        this.middleware[s] = e;
    }
    publish(s, e, t) {
        this.channels[s] && this.channels[s].publish(t, e);
    }
    subscribe(s, e, t) {
        if (this.channels[s]) this.channels[s].subscribe(e, t); else {
            const r = new Room(s, e, t);
            r.action = this.removeChannel, this.channels[s] = r;
        }
    }
    unsubscribe(s, e) {
        this.channels[s].unsubscribe(e);
    }
    broadcastMessage() {}
    removeChannel(s, e) {
        delete this.channels[e];
    }
    roomLoop() {
        setTimeout(() => {
            for (const s in this.channels) this.channels[s] && this.channels[s].flush();
            this.roomLoop();
        }, 10);
    }
}

class Worker {
    constructor(s) {
        this.options = s, this.wss = new WSServer(this.options), this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const e = new clusterwsUws.WebSocketServer({
            server: this.server
        });
        e.on("connection", s => {
            this.wss.emit("connection", new Socket(this, s));
        }), e.startAutoPing(this.options.pingInterval, !0), this.server.on("error", s => {
            logError(`${s.stack || s}`), process.exit();
        }), this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

function masterProcess(s) {
    let e = !1;
    const t = [], r = [], o = generateKey(20), i = generateKey(20);
    if (s.horizontalScaleOptions && s.horizontalScaleOptions.masterOptions) n("Scaler", -1); else for (let e = 0; e < s.brokers; e++) n("Broker", e);
    function n(c, h) {
        const a = cluster.fork();
        a.on("message", o => {
            if ("READY" === o.event) {
                if (e) return logReady(`${c} ${h} PID ${o.pid} has been restarted`);
                switch (c) {
                  case "Broker":
                    if (t[h] = ` Broker on: ${s.brokersPorts[h]}, PID ${o.pid}`, !t.includes(void 0) && t.length === s.brokers) for (let e = 0; e < s.workers; e++) n("Worker", e);
                    break;

                  case "Worker":
                    r[h] = `    Worker: ${h}, PID ${o.pid}`, r.includes(void 0) || r.length !== s.workers || (e = !0, 
                    logReady(` Master on: ${s.port}, PID ${process.pid} ${s.tlsOptions ? "(secure)" : ""}`), 
                    t.forEach(logReady), r.forEach(logReady));
                    break;

                  case "Scaler":
                    for (let e = 0; e < s.brokers; e++) n("Broker", e);
                }
            }
        }), a.on("exit", () => {
            logError(`${c} ${h} has exited`), s.restartWorkerOnFail && (logWarning(`${c} ${h} is restarting \n`), 
            n(c, h));
        }), a.send({
            processId: h,
            processName: c,
            serverId: o,
            internalSecurityKey: i
        });
    }
}

function workerProcess(s) {
    process.on("message", e => {
        switch (e.processName) {
          case "Worker":
            return new Worker(s);

          case "Broker":
            process.send({
                event: "READY",
                pid: process.pid
            });
        }
    }), process.on("uncaughtException", s => {
        logError(`${s.stack || s}`), process.exit();
    });
}

class ClusterWS {
    constructor(s) {
        if (this.options = {
            port: s.port || (s.tlsOptions ? 443 : 80),
            host: s.host,
            worker: s.worker,
            workers: s.workers || 1,
            brokers: s.brokers || 1,
            useBinary: s.useBinary,
            tlsOptions: s.tlsOptions,
            pingInterval: s.pingInterval || 2e4,
            brokersPorts: s.brokersPorts || [],
            encodeDecodeEngine: s.encodeDecodeEngine,
            restartWorkerOnFail: s.restartWorkerOnFail,
            horizontalScaleOptions: s.horizontalScaleOptions
        }, !this.options.brokersPorts.length) for (let s = 0; s < this.options.brokers; s++) this.options.brokersPorts.push(s + 9400);
        return isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? logError("Number of broker ports should be the same as number of brokers") : void (cluster.isMaster ? masterProcess(this.options) : workerProcess(this.options)) : logError("Worker must be provided and it must be a function");
    }
}

module.exports = ClusterWS; module.exports.default = ClusterWS;
