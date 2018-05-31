"use strict";

var crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster");

const noop = () => {}, OPCODE_TEXT = 1, OPCODE_PING = 9, OPCODE_BINARY = 2, APP_PONG_CODE = 65, APP_PING_CODE = Buffer.from("9"), PERMESSAGE_DEFLATE = 1, DEFAULT_PAYLOAD_LIMIT = 16777216, native = (() => {
    try {
        return require(`${require.resolve("uws").replace("uws.js", "")}uws_${process.platform}_${process.versions.modules}`);
    } catch (e) {
        const s = process.version.substring(1).split(".").map(e => parseInt(e, 10)), t = s[0] < 6 || 6 === s[0] && s[1] < 4;
        if ("win32" === process.platform && t) throw new Error("µWebSockets requires Node.js 8.0.0 or greater on Windows.");
        throw new Error("Could not run µWebSockets bindings");
    }
})();

native.setNoop(noop);

const clientGroup = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT);

native.client.group.onConnection(clientGroup, e => {
    const s = native.getUserData(e);
    s.external = e, s.internalOnOpen();
}), native.client.group.onDisconnection(clientGroup, (e, s, t, r) => {
    r.external = null, process.nextTick(() => r.internalOnClose(s, t)), native.clearUserData(e);
}), native.client.group.onError(clientGroup, e => {
    process.nextTick(() => e.internalOnError({
        message: "uWs client connection error",
        stack: "uWs client connection error"
    }));
}), native.client.group.onMessage(clientGroup, (e, s) => s.internalOnMessage(e)), 
native.client.group.onPing(clientGroup, (e, s) => s.onping(e)), native.client.group.onPong(clientGroup, (e, s) => s.onpong(e));

class UWebSocket {
    constructor(e, s = null, t = !1) {
        this.OPEN = 1, this.CLOSED = 0, this.isAlive = !0, this.external = noop, this.onping = noop, 
        this.onpong = noop, this.internalOnOpen = noop, this.internalOnError = noop, this.internalOnClose = noop, 
        this.internalOnMessage = noop, this.onpong = (() => this.isAlive = !0), this.external = s, 
        this.executeOn = t ? "server" : "client", !t && native.connect(clientGroup, e, this);
    }
    get readyState() {
        return this.external ? this.OPEN : this.CLOSED;
    }
    on(e, s) {
        return {
            ping: () => this.onping = s,
            pong: () => this.onpong = s,
            open: () => this.internalOnOpen = s,
            error: () => this.internalOnError = s,
            close: () => this.internalOnClose = s,
            message: () => this.internalOnMessage = s
        }[e](), this;
    }
    ping(e) {
        this.external && native[this.executeOn].send(this.external, e, OPCODE_PING);
    }
    send(e, s) {
        if (!this.external) return;
        const t = s && s.binary || "string" != typeof e;
        native[this.executeOn].send(this.external, e, t ? OPCODE_BINARY : OPCODE_TEXT, void 0);
    }
    terminate() {
        this.external && (native[this.executeOn].terminate(this.external), this.external = null);
    }
    close(e, s) {
        this.external && (native[this.executeOn].close(this.external, e, s), this.external = null);
    }
}

function logError(e) {
    return console.log(`[31m${e}[0m`);
}

function logReady(e) {
    return console.log(`[36m${e}[0m`);
}

function logWarning(e) {
    return console.log(`[33m${e}[0m`);
}

function isFunction(e) {
    return "[object Function]" === {}.toString.call(e);
}

function generateKey(e) {
    return crypto.randomBytes(Math.ceil(e / 2)).toString("hex").slice(0, e) + `${Date.now()}` + crypto.randomBytes(Math.ceil(e / 2)).toString("hex").slice(0, e);
}

class EventEmitterSingle {
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
    removeEvents() {
        this.events = {};
    }
}

native.setNoop(noop);

class UWebSocketsServer extends EventEmitterSingle {
    constructor(e, s) {
        if (super(), this.upgradeReq = null, this.upgradeCallback = noop, this.lastUpgradeListener = !0, 
        !e || !e.port && !e.server && !e.noServer) throw new TypeError("Wrong options");
        this.noDelay = e.noDelay || !0, this.httpServer = e.server || HTTP.createServer((e, s) => s.end()), 
        this.serverGroup = native.server.group.create(e.perMessageDeflate ? PERMESSAGE_DEFLATE : 0, e.maxPayload || DEFAULT_PAYLOAD_LIMIT), 
        !e.path || e.path.length && "/" === e.path[0] || (e.path = `/${e.path}`), this.httpServer.on("upgrade", (s, t, r) => {
            if (e.path && e.path !== s.url.split("?")[0].split("#")[0]) this.lastUpgradeListener && this.abortConnection(t, 400, "URL not supported"); else if (e.verifyClient) {
                const n = {
                    origin: s.headers.origin,
                    secure: !(!s.connection.authorized && !s.connection.encrypted),
                    req: s
                };
                e.verifyClient(n, (e, n, o) => e ? this.handleUpgrade(s, t, r, this.emitConnection) : this.abortConnection(t, n, o));
            } else this.handleUpgrade(s, t, r, this.emitConnection);
        }), this.httpServer.on("error", e => this.emit("error", e)), this.httpServer.on("newListener", (e, s) => "upgrade" === e ? this.lastUpgradeListener = !1 : null), 
        native.server.group.onConnection(this.serverGroup, e => {
            const s = new UWebSocket(null, e, !0);
            native.setUserData(e, s), this.upgradeCallback(s), this.upgradeReq = null;
        }), native.server.group.onMessage(this.serverGroup, (e, s) => {
            if (this.pingIsAppLevel && ("string" != typeof e && (e = Buffer.from(e)), e[0] === APP_PONG_CODE)) return s.isAlive = !0;
            s.internalOnMessage(e);
        }), native.server.group.onDisconnection(this.serverGroup, (e, s, t, r) => {
            r.external = null, process.nextTick(() => r.internalOnClose(s, t)), native.clearUserData(e);
        }), native.server.group.onPing(this.serverGroup, (e, s) => s.onping(e)), native.server.group.onPong(this.serverGroup, (e, s) => s.onpong(e)), 
        e.port && this.httpServer.listen(e.port, e.host || null, () => {
            this.emit("listening"), s && s();
        });
    }
    heartbeat(e, s = !1) {
        s && (this.pingIsAppLevel = !0), setTimeout(() => {
            native.server.group.forEach(this.serverGroup, this.pingIsAppLevel ? this.sendPingsAppLevel : this.sendPings), 
            this.heartbeat(e);
        }, e);
    }
    sendPings(e) {
        e.isAlive ? (e.isAlive = !1, e.ping()) : e.terminate();
    }
    sendPingsAppLevel(e) {
        e.isAlive ? (e.isAlive = !1, e.send(APP_PING_CODE)) : e.terminate();
    }
    emitConnection(e) {
        this.emit("connection", e, this.upgradeReq);
    }
    abortConnection(e, s, t) {
        e.end(`HTTP/1.1 ${s} ${t}\r\n\r\n`);
    }
    handleUpgrade(e, s, t, r) {
        if (s._isNative) this.serverGroup && (this.upgradeReq = e, this.upgradeCallback = r || noop, 
        native.upgrade(this.serverGroup, s.external, null, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"])); else {
            const t = e.headers["sec-websocket-key"], n = s.ssl ? s._parent._handle : s._handle, o = s.ssl ? s.ssl._external : null;
            if (n && t && 24 === t.length) {
                s.setNoDelay(this.noDelay);
                const i = native.transfer(-1 === n.fd ? n : n.fd, o);
                s.on("close", s => {
                    this.serverGroup && (this.upgradeReq = e, this.upgradeCallback = r || noop, native.upgrade(this.serverGroup, i, t, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"]));
                });
            }
            s.destroy();
        }
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
    return JSON.stringify({
        "#": r[t][e] || r[t]
    });
}

function decode(e, s) {
    const t = e.worker.options.encodeDecodeEngine ? e.worker.options.encodeDecodeEngine.decode(s["#"][2]) : s["#"][2], r = {
        e: () => e.events.emit(s["#"][1], t),
        p: () => e.channels[s["#"][1]] && e.worker.wss.publish(s["#"][1], t),
        s: {
            s: () => {
                const s = () => {
                    e.channels[t] = 1, e.worker.wss.channels.onMany(t, e.onPublishEvent);
                };
                e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe(e, t, e => e && s()) : s();
            },
            u: () => {
                e.worker.wss.channels.removeListener(t, e.onPublishEvent), e.channels[t] = null;
            }
        }
    };
    return r[s["#"][0]][s["#"][1]] ? r[s["#"][0]][s["#"][1]]() : r[s["#"][0]] && r[s["#"][0]]();
}

class Socket {
    constructor(e, s) {
        this.worker = e, this.socket = s, this.events = new EventEmitterSingle(), this.channels = {}, 
        this.onPublishEvent = ((e, s) => this.send(e, s, "publish")), this.send("configuration", {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        }, "system"), this.socket.on("message", e => {
            try {
                decode(this, JSON.parse(e));
            } catch (e) {
                logError(`PID: ${process.pid}\n${e}\n`);
            }
        }), this.socket.on("close", (e, s) => {
            for (let e = 0, s = Object.keys(this.channels), t = s.length; e < t; e++) this.worker.wss.channels.removeListener(s[e], this.onPublishEvent);
            this.events.emit("disconnect", e, s);
        }), this.socket.on("error", e => this.events.emit("error", e));
    }
    on(e, s) {
        this.events.on(e, s);
    }
    send(e, s, t = "emit") {
        s = encode(e, s = this.worker.options.encodeDecodeEngine ? this.worker.options.encodeDecodeEngine.encode(s) : s, t), 
        this.socket.send(this.worker.options.useBinary ? Buffer.from(s) : s);
    }
    disconnect(e, s) {
        this.socket.close(e, s);
    }
    terminate() {
        this.socket.terminate();
    }
}

class EventEmitterMany {
    constructor() {
        this.events = {};
    }
    onMany(e, s) {
        if (!isFunction(s)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push(s) : (this.events[e] = [ s ], this.changeChannelStatusInBroker(e));
    }
    emitMany(e, ...s) {
        const t = this.events[e];
        if (t) for (let r = 0, n = t.length; r < n; r++) t[r](e, ...s);
    }
    removeListener(e, s) {
        const t = this.events[e];
        if (t) {
            for (let e = 0, r = t.length; e < r; e++) if (t[e] === s) return t.splice(e, 1);
            0 === t.length && (this.events[e] = null, this.changeChannelStatusInBroker(e));
        }
    }
    exist(e) {
        return this.events[e] && this.events[e].length > 0;
    }
    changeChannelStatusInBroker(e) {}
}

class WSServer extends EventEmitterSingle {
    constructor() {
        super(), this.channels = new EventEmitterMany(), this.middleware = {}, this.internalBrokers = {
            brokers: {},
            nextBroker: -1,
            brokersKeys: [],
            brokersAmount: 0
        }, this.channels.changeChannelStatusInBroker = (e => {
            for (let s = 0; s < this.internalBrokers.brokersAmount; s++) {
                const t = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[s]];
                1 === t.readyState && t.send(e);
            }
        });
    }
    setMiddleware(e, s) {
        this.middleware[e] = s;
    }
    publishToWorkers(e) {
        this.publish("#sendToWorkers", e);
    }
    publish(e, s, t = 0) {
        if (t > 2 * this.internalBrokers.brokersAmount + 1) return logWarning("Does not have access to any broker");
        if (this.internalBrokers.brokersAmount <= 0) return setTimeout(() => this.publish(e, s, ++t), 10);
        this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++;
        const r = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]];
        return 1 !== r.readyState ? (delete this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]], 
        this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), this.internalBrokers.brokersAmount--, 
        this.publish(e, s, ++t)) : (r.send(Buffer.from(`${e}%${JSON.stringify({
            message: s
        })}`)), "#sendToWorkers" === e ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(s) : (this.channels.emitMany(e, s), 
        void (this.middleware.onPublish && this.middleware.onPublish(e, s))));
    }
    broadcastMessage(e, s) {
        const t = (s = Buffer.from(s)).indexOf(37), r = s.slice(0, t).toString(), n = JSON.parse(s.slice(t + 1)).message;
        if ("#sendToWorkers" === r) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(n);
        this.middleware.onPublish && this.middleware.onPublish(r, n), this.channels.emitMany(r, n);
    }
    setBroker(e, s) {
        this.internalBrokers.brokers[s] = e, this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;
        const t = Object.keys(this.channels.events);
        t.length && e.send(JSON.stringify(t));
    }
}

function BrokerClient(e, s, t = 0, r) {
    let n = new UWebSocket(e);
    n.on("open", () => {
        t = 0, s.setBroker(n, e), r && logReady(`Broker has been connected to ${e} \n`);
    }), n.on("close", (r, o) => {
        n = null, logWarning(`Broker has disconnected, system is trying to reconnect to ${e} \n`), 
        setTimeout(() => BrokerClient(e, s, ++t, !0), 500);
    }), n.on("error", o => {
        console.log(o), n = null, 5 === t && logWarning(`Can not connect to the Broker ${e}. System in reconnection please check your Broker and Token\n`), 
        setTimeout(() => BrokerClient(e, s, ++t, r || t > 5), 500);
    }), n.on("message", e => s.broadcastMessage(null, e));
}

class Worker {
    constructor(e, s) {
        this.options = e, this.wss = new WSServer();
        for (let e = 0; e < this.options.brokers; e++) BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[e]}/?token=${s}`, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const t = new UWebSocketsServer({
            server: this.server,
            verifyClient: (e, s) => this.wss.middleware.verifyConnection ? this.wss.middleware.verifyConnection(e, s) : s(!0)
        });
        t.on("connection", e => this.wss.emit("connection", new Socket(this, e))), t.heartbeat(this.options.pingInterval, !0), 
        this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

function GlobalBrokerServer(e, s, t) {
    const r = {
        sockets: {},
        length: 0,
        keys: []
    };
    let n;
    const o = {
        port: e,
        verifyClient: (e, t) => t(e.req.url === `/?token=${s}`)
    };
    if (t.masterOptions && t.masterOptions.tlsOptions) {
        const s = HTTPS.createServer(t.masterOptions.tlsOptions);
        o.port = null, o.server = s, n = new UWebSocketsServer(o), s.listen(e, () => process.send({
            event: "READY",
            pid: process.pid
        }));
    } else n = new UWebSocketsServer(o, () => process.send({
        event: "READY",
        pid: process.pid
    }));
    function i(e, s) {
        e.next >= e.length && (e.next = 0), e.wss[e.keys[e.next]].send(s), e.next++;
    }
    n.on("connection", e => {
        e.on("message", s => {
            "string" == typeof s ? (e.uid = generateKey(10), e.serverid = s, r.sockets[s] || (r.sockets[s] = {
                next: 0
            }), r.sockets[s].wss[e.uid] = e, r.sockets[s].keys = Object.keys(r.sockets[s].wss), 
            r.sockets[s].length++, r.length++, r.keys = Object.keys(r.sockets)) : function(e, s) {
                for (let t = 0; t < r.length; t++) {
                    const n = r.keys[t];
                    n !== e && i(r.sockets[n], s);
                }
            }(e.serverid, s);
        }), e.on("close", (s, t) => {
            delete r.sockets[e.serverid].wss[e.uid], r.sockets[e.serverid].keys = Object.keys(r.sockets[e.serverid].wss), 
            r.sockets[e.serverid].length--, r.sockets[e.serverid].length || (delete r.sockets[e.serverid], 
            r.keys = Object.keys(r.sockets), r.length--), e = null;
        });
    }), n.heartbeat(2e4);
}

function InternalBrokerServer(e, s, t) {
    const r = {
        sockets: {},
        length: 0,
        keys: []
    }, n = new UWebSocketsServer({
        port: e,
        verifyClient: (e, t) => t(e.req.url === `/?token=${s}`)
    }, () => process.send({
        event: "READY",
        pid: process.pid
    }));
    n.on("connection", e => {
        e.uid = generateKey(10), e.channels = {
            "#sendToWorkers": !0
        }, r.sockets[e.uid] = e, r.length++, r.keys = Object.keys(r.sockets), e.on("message", s => {
            if ("string" == typeof s) if ("[" !== s[0]) e.channels[s] = e.channels[s] ? null : 1; else {
                const t = JSON.parse(s);
                for (let s = 0, r = t.length; s < r; s++) e.channels[t[s]] = !0;
            } else !function(e, s) {
                const t = Buffer.from(s), n = t.slice(0, t.indexOf(37)).toString();
                for (let t = 0; t < r.length; t++) {
                    const o = r.keys[t];
                    if (o !== e) {
                        const e = r.sockets[o];
                        e.channels[n] && e.send(s);
                    }
                }
            }(e.uid, s);
        }), e.on("close", (s, t) => {
            delete r.sockets[e.uid], r.length--, r.keys = Object.keys(r.sockets), e = null;
        });
    }), n.heartbeat(2e4);
}

class ClusterWS {
    constructor(e) {
        const s = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            host: e.host || null,
            worker: e.worker,
            workers: e.workers || 1,
            brokers: e.brokers || 1,
            useBinary: e.useBinary || !1,
            brokersPorts: e.brokersPorts || [],
            tlsOptions: e.tlsOptions || !1,
            pingInterval: e.pingInterval || 2e4,
            restartWorkerOnFail: e.restartWorkerOnFail || !1,
            horizontalScaleOptions: e.horizontalScaleOptions || !1,
            encodeDecodeEngine: e.encodeDecodeEngine || !1
        };
        if (!isFunction(s.worker)) return logError("Worker param must be provided and it must be a function \n");
        if (!e.brokersPorts) for (let e = 0; e < s.brokers; e++) s.brokersPorts.push(e + 9400);
        if (s.brokersPorts.length !== s.brokers) return logError("Number of broker ports should be the same as number of brokers\n");
        cluster.isMaster ? this.masterProcess(s) : this.workerProcess(s);
    }
    masterProcess(e) {
        let s = !1;
        const t = generateKey(16), r = {}, n = {};
        if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) o("Scaler", -1); else for (let s = 0; s < e.brokers; s++) o("Broker", s);
        function o(i, l) {
            let a = cluster.fork();
            a.on("message", t => "READY" === t.event && function(t, i, l) {
                if (s) return logReady(`${t} PID ${l} has been restarted`);
                "Worker" === t && (n[i] = `\tWorker: ${i}, PID ${l}`);
                if ("Scaler" === t) for (let s = 0; s < e.brokers; s++) o("Broker", s);
                if ("Broker" === t && (r[i] = `>>>  Broker on: ${e.brokersPorts[i]}, PID ${l}`, 
                Object.keys(r).length === e.brokers)) for (let s = 0; s < e.workers; s++) o("Worker", s);
                Object.keys(r).length === e.brokers && Object.keys(n).length === e.workers && (s = !0, 
                logReady(`>>>  Master on: ${e.port}, PID: ${process.pid} ${e.tlsOptions ? " (secure)" : ""}`), 
                Object.keys(r).forEach(e => r.hasOwnProperty(e) && logReady(r[e])), Object.keys(n).forEach(e => n.hasOwnProperty(e) && logReady(n[e])));
            }(i, l, t.pid)), a.on("exit", () => {
                a = null, logError(`${i} has exited \n`), e.restartWorkerOnFail && (logWarning(`${i} is restarting \n`), 
                o(i, l));
            }), a.send({
                securityKey: t,
                processId: l,
                processName: i
            });
        }
    }
    workerProcess(e) {
        process.on("message", s => {
            const t = {
                Worker: () => new Worker(e, s.securityKey),
                Broker: () => InternalBrokerServer(e.brokersPorts[s.processId], s.securityKey, e.horizontalScaleOptions),
                Scaler: () => e.horizontalScaleOptions && GlobalBrokerServer(e.horizontalScaleOptions.masterOptions.port, e.horizontalScaleOptions.key || "", e.horizontalScaleOptions)
            };
            t[s.processName] && t[s.processName]();
        }), process.on("uncaughtException", e => {
            logError(`PID: ${process.pid}\n ${e.stack}\n`), process.exit();
        });
    }
}

ClusterWS.uWebSocket = UWebSocket, ClusterWS.uWebSocketServer = UWebSocketsServer, 
module.exports = ClusterWS, module.exports.default = ClusterWS;
