"use strict";

var crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster");

const noop = () => {}, OPCODE_TEXT = 1, OPCODE_PING = 9, OPCODE_BINARY = 2, APP_PONG_CODE = 65, APP_PING_CODE = Buffer.from("9"), PERMESSAGE_DEFLATE = 1, DEFAULT_PAYLOAD_LIMIT = 16777216, native = (() => {
    try {
        return require(`${require.resolve("uws").replace("uws.js", "")}uws_${process.platform}_${process.versions.modules}`);
    } catch (e) {
        const r = process.version.substring(1).split(".").map(e => parseInt(e, 10)), s = r[0] < 6 || 6 === r[0] && r[1] < 4;
        if ("win32" === process.platform && s) throw new Error("µWebSockets requires Node.js 8.0.0 or greater on Windows.");
        throw e;
    }
})();

native.setNoop(noop);

const clientGroup = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT);

native.client.group.onConnection(clientGroup, e => {
    const r = native.getUserData(e);
    r.external = e, r.internalOnOpen();
}), native.client.group.onDisconnection(clientGroup, (e, r, s, t) => {
    t.external = null, process.nextTick(() => {
        t.internalOnClose(r, s), t = null;
    }), native.clearUserData(e);
}), native.client.group.onError(clientGroup, e => {
    process.nextTick(() => e.internalOnError({
        message: "cWs client connection error",
        stack: "cWs client connection error"
    }));
}), native.client.group.onMessage(clientGroup, (e, r) => r.internalOnMessage(e)), 
native.client.group.onPing(clientGroup, (e, r) => r.onping(e)), native.client.group.onPong(clientGroup, (e, r) => r.onpong(e));

class WebSocket {
    constructor(e, r = null, s = !1) {
        this.OPEN = 1, this.CLOSED = 0, this.isAlive = !0, this.external = noop, this.onping = noop, 
        this.onpong = noop, this.internalOnOpen = noop, this.internalOnError = noop, this.internalOnClose = noop, 
        this.internalOnMessage = noop, this.onpong = (() => this.isAlive = !0), this.external = r, 
        this.executeOn = s ? "server" : "client", !s && native.connect(clientGroup, e, this);
    }
    get readyState() {
        return this.external ? this.OPEN : this.CLOSED;
    }
    on(e, r) {
        return {
            ping: () => this.onping = r,
            pong: () => this.onpong = r,
            open: () => this.internalOnOpen = r,
            error: () => this.internalOnError = r,
            close: () => this.internalOnClose = r,
            message: () => this.internalOnMessage = r
        }[e](), this;
    }
    ping(e) {
        this.external && native[this.executeOn].send(this.external, e, OPCODE_PING);
    }
    send(e, r) {
        if (!this.external) return;
        const s = r && r.binary || "string" != typeof e;
        native[this.executeOn].send(this.external, e, s ? OPCODE_BINARY : OPCODE_TEXT, void 0);
    }
    terminate() {
        this.external && (native[this.executeOn].terminate(this.external), this.external = null);
    }
    close(e, r) {
        this.external && (native[this.executeOn].close(this.external, e, r), this.external = null);
    }
}

function keysOf(e) {
    return Object.keys(e);
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
    return crypto.randomBytes(Math.ceil(e / 4)).toString("hex").slice(0, e / 2) + Date.now() + crypto.randomBytes(Math.ceil(e / 4)).toString("hex").slice(0, e / 2);
}

class EventEmitterSingle {
    constructor() {
        this.events = {};
    }
    on(e, r) {
        if (!isFunction(r)) return logError("Listener must be a function");
        this.events[e] = r;
    }
    emit(e, ...r) {
        const s = this.events[e];
        s && s(...r);
    }
    removeEvents() {
        this.events = {};
    }
}

native.setNoop(noop);

class WebSocketsServer extends EventEmitterSingle {
    constructor(e, r) {
        if (super(), this.upgradeReq = null, this.upgradeCallback = noop, this.lastUpgradeListener = !0, 
        !e || !e.port && !e.server && !e.noServer) throw new TypeError("Wrong options");
        this.noDelay = e.noDelay || !0, this.httpServer = e.server || HTTP.createServer((e, r) => r.end()), 
        this.serverGroup = native.server.group.create(e.perMessageDeflate ? PERMESSAGE_DEFLATE : 0, e.maxPayload || DEFAULT_PAYLOAD_LIMIT), 
        !e.path || e.path.length && "/" === e.path[0] || (e.path = `/${e.path}`), this.httpServer.on("upgrade", (r, s, t) => {
            if (r.remoteAddress = s.remoteAddress, e.path && e.path !== r.url.split("?")[0].split("#")[0]) this.lastUpgradeListener && this.abortConnection(s, 400, "URL not supported"); else if (e.verifyClient) {
                const n = {
                    origin: r.headers.origin,
                    secure: !(!r.connection.authorized && !r.connection.encrypted),
                    req: r
                };
                e.verifyClient(n, (e, n, o) => e ? this.handleUpgrade(r, s, t, this.emitConnection) : this.abortConnection(s, n, o));
            } else this.handleUpgrade(r, s, t, this.emitConnection);
        }), this.httpServer.on("error", e => this.emit("error", e)), this.httpServer.on("newListener", (e, r) => "upgrade" === e ? this.lastUpgradeListener = !1 : null), 
        native.server.group.onConnection(this.serverGroup, e => {
            const r = new WebSocket(null, e, !0);
            native.setUserData(e, r), this.upgradeCallback(r), this.upgradeReq = null;
        }), native.server.group.onMessage(this.serverGroup, (e, r) => {
            let s;
            if (this.pingIsAppLevel) if ("string" != typeof e) {
                if ((s = Buffer.from(e))[0] === APP_PONG_CODE) return r.isAlive = !0;
            } else s = e; else s = e;
            r.internalOnMessage(s);
        }), native.server.group.onDisconnection(this.serverGroup, (e, r, s, t) => {
            t.external = null, process.nextTick(() => {
                t.internalOnClose(r, s), t = null;
            }), native.clearUserData(e);
        }), native.server.group.onPing(this.serverGroup, (e, r) => r.onping(e)), native.server.group.onPong(this.serverGroup, (e, r) => r.onpong(e)), 
        e.port && this.httpServer.listen(e.port, e.host || null, () => {
            this.emit("listening"), r && r();
        });
    }
    heartbeat(e, r = !1) {
        r && (this.pingIsAppLevel = !0), setTimeout(() => {
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
    abortConnection(e, r, s) {
        e.end(`HTTP/1.1 ${r} ${s}\r\n\r\n`);
    }
    handleUpgrade(e, r, s, t) {
        if (r._isNative) this.serverGroup && (this.upgradeReq = e, this.upgradeCallback = t || noop, 
        native.upgrade(this.serverGroup, r.external, null, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"])); else {
            const s = e.headers["sec-websocket-key"], n = r.ssl ? r._parent._handle : r._handle, o = r.ssl ? r.ssl._external : null;
            if (n && s && 24 === s.length) {
                r.setNoDelay(this.noDelay);
                const i = native.transfer(-1 === n.fd ? n : n.fd, o);
                r.on("close", r => {
                    this.serverGroup && (this.upgradeReq = e, this.upgradeCallback = t || noop, native.upgrade(this.serverGroup, i, s, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"]));
                });
            }
            r.destroy();
        }
    }
}

class Socket {
    constructor(e, r) {
        this.worker = e, this.socket = r, this.id = generateKey(10), this.events = new EventEmitterSingle(), 
        this.channels = {};
        const s = {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        };
        this.send("configuration", s, "system"), this.onPublishEvent = ((e, r) => this.send(e, r, "publish")), 
        this.socket.on("message", e => {
            try {
                this.worker.wss.middleware.onMessageReceive ? this.worker.wss.middleware.onMessageReceive(this, e, e => {
                    e && this.decode(e);
                }) : this.decode(JSON.parse(e));
            } catch (e) {
                logError(`\n${e}\n`);
            }
        }), this.socket.on("close", (e, r) => {
            for (let e = 0, r = keysOf(this.channels), s = r.length; e < s; e++) this.worker.wss.channels.unsubscribe(r[e], this.id);
            this.events.emit("disconnect", e, r), this.events.removeEvents();
        }), this.socket.on("error", e => this.events.emit("error", e));
    }
    on(e, r) {
        this.events.on(e, r);
    }
    send(e, r, s = "emit") {
        r = this.worker.options.encodeDecodeEngine ? this.worker.options.encodeDecodeEngine.encode(r) : r, 
        r = this.encode(e, r, s), this.socket.send(this.worker.options.useBinary ? Buffer.from(r) : r);
    }
    disconnect(e, r) {
        this.socket.close(e, r);
    }
    terminate() {
        this.socket.terminate();
    }
    encode(e, r, s) {
        const t = {
            emit: [ "e", e, r ],
            publish: [ "p", e, r ],
            system: {
                configuration: [ "s", "c", r ]
            }
        };
        return JSON.stringify({
            "#": t[s][e] || t[s]
        });
    }
    decode(e) {
        const r = this.worker.options.encodeDecodeEngine ? this.worker.options.encodeDecodeEngine.decode(e["#"][2]) : e["#"][2], s = {
            e: () => this.events.emit(e["#"][1], r),
            p: () => this.channels[e["#"][1]] && this.worker.wss.publish(e["#"][1], r),
            s: {
                s: () => {
                    if (this.channels[r]) return;
                    const e = () => {
                        this.channels[r] = 1, this.worker.wss.channels.subscribe(r, this.onPublishEvent, this.id);
                    };
                    this.worker.wss.middleware.onSubscribe ? this.worker.wss.middleware.onSubscribe(this, r, r => r && e()) : e();
                },
                u: () => {
                    this.channels[r] && (this.worker.wss.channels.unsubscribe(r, this.id), this.worker.wss.middleware.onUnsubscribe && this.worker.wss.middleware.onUnsubscribe(this, r), 
                    this.channels[r] = null);
                }
            }
        };
        s[e["#"][0]][e["#"][1]] ? s[e["#"][0]][e["#"][1]]() : s[e["#"][0]] && s[e["#"][0]]();
    }
}

class EventEmitterMany {
    constructor() {
        this.events = {};
    }
    subscribe(e, r, s) {
        if (!isFunction(r)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push({
            token: s,
            listener: r
        }) : (this.events[e] = [ {
            token: s,
            listener: r
        } ], this.changeChannelStatusInBroker(e, "create"));
    }
    publish(e, ...r) {
        const s = this.events[e];
        if (s) for (let t = 0, n = s.length; t < n; t++) s[t].listener(e, ...r);
    }
    unsubscribe(e, r) {
        const s = this.events[e];
        if (s) {
            for (let e = 0, t = s.length; e < t; e++) if (s[e].token === r) {
                s.splice(e, 1);
                break;
            }
            0 === s.length && (this.events[e] = null, this.changeChannelStatusInBroker(e, "destroy"));
        }
    }
    exist(e) {
        return this.events[e];
    }
    changeChannelStatusInBroker(e, r) {}
}

class WSServer extends EventEmitterSingle {
    constructor() {
        super(), this.channels = new EventEmitterMany(), this.middleware = {}, this.internalBrokers = {
            brokers: {},
            nextBroker: -1,
            brokersKeys: [],
            brokersAmount: 0
        }, this.channels.changeChannelStatusInBroker = ((e, r) => {
            "create" === r && this.middleware.onChannelOpen && this.middleware.onChannelOpen(e), 
            "destroy" === r && this.middleware.onChannelClose && this.middleware.onChannelClose(e);
            for (let r = 0; r < this.internalBrokers.brokersAmount; r++) {
                const s = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[r]];
                1 === s.readyState && s.send(e);
            }
        });
    }
    setMiddleware(e, r) {
        this.middleware[e] = r;
    }
    setWatcher(e, r) {
        this.channels.subscribe(e, (e, ...s) => r(...s), "worker");
    }
    removeWatcher(e) {
        this.channels.unsubscribe(e, "worker");
    }
    publishToWorkers(e) {
        this.publish("#sendToWorkers", e);
    }
    publish(e, r, s = 0) {
        if (s > 2 * this.internalBrokers.brokersAmount + 1) return logWarning("Does not have access to any broker");
        if (this.internalBrokers.brokersAmount <= 0) return setTimeout(() => this.publish(e, r, ++s), 10);
        this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++;
        const t = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]];
        return 1 !== t.readyState ? (this.clearBroker(this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]), 
        this.publish(e, r, ++s)) : (t.send(Buffer.from(`${e}%${JSON.stringify({
            message: r
        })}`)), "#sendToWorkers" === e ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(r) : (this.channels.publish(e, r), 
        void (this.middleware.onPublish && this.middleware.onPublish(e, r))));
    }
    broadcastMessage(e, r) {
        const s = Buffer.from(r), t = s.indexOf(37), n = s.slice(0, t).toString(), o = JSON.parse(s.slice(t + 1)).message;
        if ("#sendToWorkers" === n) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(o);
        this.middleware.onPublish && this.middleware.onPublish(n, o), this.channels.publish(n, o);
    }
    clearBroker(e) {
        this.internalBrokers.brokers[e] && (delete this.internalBrokers.brokers[e], this.internalBrokers.brokersKeys = keysOf(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount--);
    }
    setBroker(e, r) {
        this.internalBrokers.brokers[r] = e, this.internalBrokers.brokersKeys = keysOf(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;
        const s = keysOf(this.channels.events);
        s.length && e.send(JSON.stringify(s));
    }
}

function BrokerClient(e, r, s = 0, t) {
    let n = new WebSocket(e);
    n.on("open", () => {
        s = 0, r.setBroker(n, e), t && logReady(`Broker PID ${process.pid} has been connected to ${e}\n`);
    }), n.on("close", (t, o) => {
        if (n = null, 1e3 === t) return logWarning(`Broker has disconnected from ${e} with code 1000\n`);
        r.clearBroker(e), logWarning(`Broker has disconnected, system is trying to reconnect to ${e}\n`), 
        setTimeout(() => BrokerClient(e, r, ++s, !0), Math.floor(1e3 * Math.random()) + 500);
    }), n.on("error", o => {
        n = null, r.clearBroker(e), 5 === s && logWarning(`Can not connect to the Broker ${e}. System in reconnection please check your Broker and Token\n`), 
        setTimeout(() => BrokerClient(e, r, ++s, t || s > 5), Math.floor(1e3 * Math.random()) + 500);
    }), n.on("message", e => r.broadcastMessage(null, e));
}

class Worker {
    constructor(e, r, s) {
        this.options = e, this.id = r, this.wss = new WSServer();
        for (let e = 0; e < this.options.brokers; e++) BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[e]}/?token=${s}`, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const t = new WebSocketsServer({
            server: this.server,
            verifyClient: (e, r) => this.wss.middleware.verifyConnection ? this.wss.middleware.verifyConnection(e, r) : r(!0)
        });
        t.on("connection", (e, r) => this.wss.emit("connection", new Socket(this, e), r)), 
        t.heartbeat(this.options.pingInterval, !0), this.server.listen(this.options.port, this.options.host, () => {
            this.options.worker.call(this), process.send({
                event: "READY",
                pid: process.pid
            });
        });
    }
}

function GlobalBrokerServer(e) {
    const r = {
        sockets: {},
        length: 0,
        keys: []
    };
    let s;
    const t = {
        port: e.masterOptions.port,
        verifyClient: (r, s) => s(r.req.url === `/?token=${e.key || ""}`)
    };
    if (e.masterOptions.tlsOptions) {
        const r = HTTPS.createServer(e.masterOptions.tlsOptions);
        t.port = null, t.server = r, s = new WebSocketsServer(t), r.listen(e.masterOptions.port, () => process.send({
            event: "READY",
            pid: process.pid
        }));
    } else s = new WebSocketsServer(t, () => process.send({
        event: "READY",
        pid: process.pid
    }));
    function n(e, r) {
        e.next >= e.length && (e.next = 0), e.wss[e.keys[e.next]].send(r), e.next++;
    }
    s.on("connection", e => {
        e.on("message", s => {
            e.uid || "string" != typeof s ? e.uid && function(e, s) {
                for (let t = 0; t < r.length; t++) {
                    const o = r.keys[t];
                    o !== e && n(r.sockets[o], s);
                }
            }(e.serverid, s) : (e.uid = generateKey(10), e.serverid = s, r.sockets[s] || (r.sockets[s] = {
                wss: {},
                next: 0,
                length: 0,
                keys: []
            }, r.length++, r.keys = keysOf(r.sockets)), r.sockets[s].wss[e.uid] = e, r.sockets[s].keys = keysOf(r.sockets[s].wss), 
            r.sockets[s].length++);
        }), e.on("close", (s, t) => {
            e.uid && (delete r.sockets[e.serverid].wss[e.uid], r.sockets[e.serverid].keys = keysOf(r.sockets[e.serverid].wss), 
            r.sockets[e.serverid].length--, r.sockets[e.serverid].length || (delete r.sockets[e.serverid], 
            r.keys = keysOf(r.sockets), r.length--)), e = null;
        });
    }), s.heartbeat(2e4);
}

function InternalBrokerServer(e, r, s) {
    const t = {
        sockets: {},
        length: 0,
        keys: []
    }, n = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    }, o = new WebSocketsServer({
        port: e,
        verifyClient: (e, s) => s(e.req.url === `/?token=${r}`)
    }, () => process.send({
        event: "READY",
        pid: process.pid
    }));
    if (o.on("connection", e => {
        e.uid = generateKey(10), e.channels = {
            "#sendToWorkers": !0
        }, t.sockets[e.uid] = e, t.length++, t.keys = keysOf(t.sockets), e.on("message", r => {
            if ("string" == typeof r) if ("[" !== r[0]) e.channels[r] = e.channels[r] ? null : 1; else {
                const s = JSON.parse(r);
                for (let r = 0, t = s.length; r < t; r++) e.channels[s[r]] = !0;
            } else a(e.uid, r), s && function e(r) {
                if (n.brokersAmount <= 0) return;
                n.nextBroker >= n.brokersAmount - 1 ? n.nextBroker = 0 : n.nextBroker++;
                const s = n.brokers[n.brokersKeys[n.nextBroker]];
                if (1 !== s.readyState) return i(n.brokersKeys[n.nextBroker]), e(r);
                s.send(r);
            }(r);
        }), e.on("close", (r, s) => {
            delete t.sockets[e.uid], t.length--, t.keys = keysOf(t.sockets), e = null;
        });
    }), o.heartbeat(2e4), s) {
        s.masterOptions && l(`${s.masterOptions.tlsOptions ? "wss" : "ws"}://127.0.0.1:${s.masterOptions.port}/?token=${s.key || ""}`);
        for (let e = 0, r = s.brokersUrls.length; e < r; e++) l(`${s.brokersUrls[e]}/?token=${s.key || ""}`);
    }
    function i(e) {
        n.brokers[e] && (delete n.brokers[e], n.brokersKeys = keysOf(n.brokers), n.brokersAmount--);
    }
    function l(e) {
        BrokerClient(e, {
            clearBroker: i,
            broadcastMessage: a,
            setBroker: (e, r) => {
                n.brokers[r] = e, n.brokersKeys = keysOf(n.brokers), n.brokersAmount = n.brokersKeys.length, 
                e.send(s.serverId);
            }
        });
    }
    function a(e, r) {
        const s = Buffer.from(r), n = s.slice(0, s.indexOf(37)).toString();
        for (let s = 0; s < t.length; s++) {
            const o = t.keys[s];
            if (o !== e) {
                const e = t.sockets[o];
                e.channels[n] && e.send(r);
            }
        }
    }
}

function masterProcess(e) {
    let r = !1;
    const s = {}, t = {}, n = generateKey(10), o = generateKey(10);
    if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) i("Scaler", -1); else for (let r = 0; r < e.brokers; r++) i("Broker", r);
    function i(l, a) {
        let c = cluster.fork();
        c.on("message", n => {
            if ("READY" !== n.event) return;
            if (r) return logReady(`${l} PID ${n.pid} has been restarted`);
            ({
                Scaler: () => {
                    for (let r = 0; r < e.brokers; r++) i("Broker", r);
                },
                Broker: () => {
                    if (s[a] = ` Broker on: ${e.brokersPorts[a]}, PID ${n.pid}`, keysOf(s).length === e.brokers) for (let r = 0; r < e.workers; r++) i("Worker", r);
                },
                Worker: () => {
                    t[a] = `    Worker: ${a}, PID ${n.pid}`, keysOf(s).length === e.brokers && keysOf(t).length === e.workers && (r = !0, 
                    logReady(` Master on: ${e.port}, PID ${process.pid} ${e.tlsOptions ? " (secure)" : ""}`), 
                    keysOf(s).forEach(e => logReady(s[e])), keysOf(t).forEach(e => logReady(t[e])));
                }
            })[l]();
        }), c.on("exit", () => {
            c = null, logError(`${l} has exited \n`), e.restartWorkerOnFail && (logWarning(`${l} is restarting \n`), 
            i(l, a));
        }), c.send({
            processId: a,
            processName: l,
            securityKey: n,
            uniqueServerId: o
        });
    }
}

function workerProcess(e) {
    process.on("message", r => {
        const s = {
            Worker: () => new Worker(e, r.processId, r.securityKey),
            Scaler: () => e.horizontalScaleOptions && GlobalBrokerServer(e.horizontalScaleOptions),
            Broker: () => {
                e.horizontalScaleOptions && (e.horizontalScaleOptions.serverId = r.uniqueServerId), 
                InternalBrokerServer(e.brokersPorts[r.processId], r.securityKey, e.horizontalScaleOptions);
            }
        };
        s[r.processName] && s[r.processName]();
    }), process.on("uncaughtException", e => {
        logError(`PID: ${process.pid}\n ${e.stack}\n`), process.exit();
    });
}

class ClusterWS {
    constructor(e) {
        const r = {
            port: e.port || (e.tlsOptions ? 443 : 80),
            host: e.host || null,
            worker: e.worker,
            workers: e.workers || 1,
            brokers: e.brokers || 1,
            useBinary: e.useBinary || !1,
            tlsOptions: e.tlsOptions || !1,
            pingInterval: e.pingInterval || 2e4,
            brokersPorts: e.brokersPorts || [],
            encodeDecodeEngine: e.encodeDecodeEngine || !1,
            restartWorkerOnFail: e.restartWorkerOnFail || !1,
            horizontalScaleOptions: e.horizontalScaleOptions || !1
        };
        if (!r.brokersPorts.length) for (let e = 0; e < r.brokers; e++) r.brokersPorts.push(e + 9400);
        if (r.brokers !== r.brokersPorts.length || !isFunction(r.worker)) return logError(isFunction(r.worker) ? "Number of broker ports should be the same as number of brokers\n" : "Worker param must be provided and it must be a function \n");
        cluster.isMaster ? masterProcess(r) : workerProcess(r);
    }
}

ClusterWS.cWebSocket = WebSocket, ClusterWS.cWebSocketServer = WebSocketsServer, 
module.exports = ClusterWS, module.exports.default = ClusterWS;
