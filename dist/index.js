"use strict";

var crypto = require("crypto"), HTTP = require("http"), HTTPS = require("https"), cluster = require("cluster");

const noop = () => {}, OPCODE_TEXT = 1, OPCODE_PING = 9, OPCODE_BINARY = 2, APP_PONG_CODE = 65, APP_PING_CODE = Buffer.from("9"), PERMESSAGE_DEFLATE = 1, DEFAULT_PAYLOAD_LIMIT = 16777216, native = (() => {
    try {
        return require(`${require.resolve("uws").replace("uws.js", "")}uws_${process.platform}_${process.versions.modules}`);
    } catch (e) {
        const r = process.version.substring(1).split(".").map(e => parseInt(e, 10)), t = r[0] < 6 || 6 === r[0] && r[1] < 4;
        if ("win32" === process.platform && t) throw new Error("µWebSockets requires Node.js 8.0.0 or greater on Windows.");
        throw new Error("Could not run µWebSockets bindings");
    }
})();

native.setNoop(noop);

const clientGroup = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT);

native.client.group.onConnection(clientGroup, e => {
    const r = native.getUserData(e);
    r.external = e, r.internalOnOpen();
}), native.client.group.onDisconnection(clientGroup, (e, r, t, s) => {
    s.external = null, process.nextTick(() => s.internalOnClose(r, t)), native.clearUserData(e);
}), native.client.group.onError(clientGroup, e => {
    process.nextTick(() => e.internalOnError({
        message: "uWs client connection error",
        stack: "uWs client connection error"
    }));
}), native.client.group.onMessage(clientGroup, (e, r) => r.internalOnMessage(e)), 
native.client.group.onPing(clientGroup, (e, r) => r.onping(e)), native.client.group.onPong(clientGroup, (e, r) => r.onpong(e));

class UWebSocket {
    constructor(e, r = null, t = !1) {
        this.OPEN = 1, this.CLOSED = 0, this.isAlive = !0, this.external = noop, this.onping = noop, 
        this.onpong = noop, this.internalOnOpen = noop, this.internalOnError = noop, this.internalOnClose = noop, 
        this.internalOnMessage = noop, this.onpong = (() => this.isAlive = !0), this.external = r, 
        this.executeOn = t ? "server" : "client", !t && native.connect(clientGroup, e, this);
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
        const t = r && r.binary || "string" != typeof e;
        native[this.executeOn].send(this.external, e, t ? OPCODE_BINARY : OPCODE_TEXT, void 0);
    }
    terminate() {
        this.external && (native[this.executeOn].terminate(this.external), this.external = null);
    }
    close(e, r) {
        this.external && (native[this.executeOn].close(this.external, e, r), this.external = null);
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
    return "[object Function]" !== {}.toString.call(e);
}

function generateKey(e) {
    return crypto.randomBytes(Math.ceil(e / 2)).toString("hex").slice(0, e);
}

class EventEmitterSingle {
    constructor() {
        this.events = {};
    }
    on(e, r) {
        if (isFunction(r)) return logError("Listener must be a function");
        this.events[e] = r;
    }
    emit(e, ...r) {
        const t = this.events[e];
        t && t(...r);
    }
    removeEvents() {
        this.events = {};
    }
}

native.setNoop(noop);

class UWebSocketServer extends EventEmitterSingle {
    constructor(e, r) {
        if (super(), this.upgradeReq = null, this.upgradeCallback = noop, this.lastUpgradeListener = !0, 
        !e || !e.port && !e.server && !e.noServer) throw new TypeError("Wrong options");
        this.noDelay = e.noDelay || !0, this.httpServer = e.server || HTTP.createServer((e, r) => r.end()), 
        this.serverGroup = native.server.group.create(e.perMessageDeflate ? PERMESSAGE_DEFLATE : 0, e.maxPayload || DEFAULT_PAYLOAD_LIMIT), 
        !e.path || e.path.length && "/" === e.path[0] || (e.path = `/${e.path}`), this.httpServer.on("upgrade", (r, t, s) => {
            if (e.path && e.path !== r.url.split("?")[0].split("#")[0]) this.lastUpgradeListener && this.abortConnection(t, 400, "URL not supported"); else if (e.verifyClient) {
                const n = {
                    origin: r.headers.origin,
                    secure: !(!r.connection.authorized && !r.connection.encrypted),
                    req: r
                };
                e.verifyClient(n, (e, n, o) => e ? this.handleUpgrade(r, t, s, this.emitConnection) : this.abortConnection(t, n, o));
            } else this.handleUpgrade(r, t, s, this.emitConnection);
        }), this.httpServer.on("error", e => this.emit("error", e)), this.httpServer.on("newListener", (e, r) => "upgrade" === e ? this.lastUpgradeListener = !1 : null), 
        native.server.group.onConnection(this.serverGroup, e => {
            const r = new UWebSocket(null, e, !0);
            native.setUserData(e, r), this.upgradeCallback(r), this.upgradeReq = null;
        }), native.server.group.onMessage(this.serverGroup, (e, r) => {
            if (this.pingIsAppLevel && ("string" != typeof e && (e = Buffer.from(e)), e[0] === APP_PONG_CODE)) return r.isAlive = !0;
            r.internalOnMessage(e);
        }), native.server.group.onDisconnection(this.serverGroup, (e, r, t, s) => {
            s.external = null, process.nextTick(() => s.internalOnClose(r, t)), native.clearUserData(e);
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
    abortConnection(e, r, t) {
        e.end(`HTTP/1.1 ${r} ${t}\r\n\r\n`);
    }
    handleUpgrade(e, r, t, s) {
        if (r._isNative) this.serverGroup && (this.upgradeReq = e, this.upgradeCallback = s || noop, 
        native.upgrade(this.serverGroup, r.external, null, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"])); else {
            const t = e.headers["sec-websocket-key"], n = r.ssl ? r._parent._handle : r._handle, o = r.ssl ? r.ssl._external : null;
            if (n && t && 24 === t.length) {
                r.setNoDelay(this.noDelay);
                const i = native.transfer(-1 === n.fd ? n : n.fd, o);
                r.on("close", r => {
                    this.serverGroup && (this.upgradeReq = e, this.upgradeCallback = s || noop, native.upgrade(this.serverGroup, i, t, e.headers["sec-websocket-extensions"], e.headers["sec-websocket-protocol"]));
                });
            }
            r.destroy();
        }
    }
}

function encode(e, r, t) {
    const s = {
        emit: {
            "#": [ "e", e, r ]
        },
        publish: {
            "#": [ "p", e, r ]
        },
        system: {
            subscribe: {
                "#": [ "s", "s", r ]
            },
            unsubscribe: {
                "#": [ "s", "u", r ]
            },
            configuration: {
                "#": [ "s", "c", r ]
            }
        }
    };
    return JSON.stringify("system" === t ? s[t][e] : s[t]);
}

function decode(e, r) {
    const t = e.worker.options.encodeDecodeEngine ? e.worker.options.encodeDecodeEngine.decode(r["#"][2]) : r["#"][2], s = {
        e: () => e.events.emit(r["#"][1], t),
        p: () => e.channels[r["#"][1]] && e.worker.wss.publish(r["#"][1], t),
        s: {
            s: () => {
                const r = () => {
                    e.channels[t] = 1, e.worker.wss.channels.onMany(t, e.onPublishEvent);
                };
                e.worker.wss.middleware.onSubscribe ? e.worker.wss.middleware.onSubscribe(e, t, e => e && r()) : r();
            },
            u: () => {
                e.worker.wss.channels.removeListener(t, e.onPublishEvent), e.channels[t] = null;
            }
        }
    };
    return "s" === r["#"][0] ? s[r["#"][0]][r["#"][1]] && s[r["#"][0]][r["#"][1]]() : s[r["#"][0]] && s[r["#"][0]]();
}

class Socket {
    constructor(e, r) {
        this.events = new EventEmitterSingle(), this.channels = {}, this.worker = e, this.socket = r, 
        this.onPublishEvent = ((e, r) => this.send(e, r, "publish")), this.send("configuration", {
            ping: this.worker.options.pingInterval,
            binary: this.worker.options.useBinary
        }, "system"), this.socket.on("error", e => this.events.emit("error", e)), this.socket.on("message", e => {
            try {
                decode(this, e = JSON.parse(e));
            } catch (e) {
                return logError(`PID: ${process.pid}\n${e}\n`);
            }
        }), this.socket.on("close", (e, r) => {
            this.events.emit("disconnect", e, r);
            for (let e = 0, r = Object.keys(this.channels), t = r.length; e < t; e++) this.worker.wss.channels.removeListener(r[e], this.onPublishEvent);
            for (let e = 0, r = Object.keys(this), t = r.length; e < t; e++) this[r[e]] = null;
        });
    }
    on(e, r) {
        this.events.on(e, r);
    }
    send(e, r, t = "emit") {
        r = this.worker.options.encodeDecodeEngine ? this.worker.options.encodeDecodeEngine.encode(r) : r, 
        this.socket.send(this.worker.options.useBinary ? Buffer.from(encode(e, r, t)) : encode(e, r, t));
    }
    disconnect(e, r) {
        this.socket.close(e, r);
    }
    terminate() {
        this.socket.terminate();
    }
}

class EventEmitterMany {
    constructor() {
        this.events = {};
    }
    onMany(e, r) {
        if (isFunction(r)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push(r) : this.events[e] = [ r ];
    }
    emitMany(e, ...r) {
        const t = this.events[e];
        if (t) for (let s = 0, n = t.length; s < n; s++) t[s](e, ...r);
    }
    removeListener(e, r) {
        const t = this.events[e];
        if (t) {
            for (let e = 0, s = t.length; e < s; e++) if (t[e] === r) return t.splice(e, 1);
            0 === t.length && (this.events[e] = null);
        }
    }
    exist(e) {
        return this.events[e] && this.events[e].length > 0;
    }
}

class WSServer extends EventEmitterSingle {
    constructor() {
        super(...arguments), this.channels = new EventEmitterMany(), this.middleware = {}, 
        this.internalBrokers = {
            brokers: {},
            nextBroker: -1,
            brokersKeys: [],
            brokersAmount: 0
        };
    }
    setMiddleware(e, r) {
        this.middleware[e] = r;
    }
    publishToWorkers(e) {
        this.publish("#sendToWorkers", e);
    }
    publish(e, r, t = 0) {
        if (t > 2 * this.internalBrokers.brokersAmount + 10) return logWarning("Does not have access to any broker");
        if (this.internalBrokers.brokersAmount <= 0) return setTimeout(() => this.publish(e, r, ++t), 10);
        this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ? this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++;
        const s = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]];
        return 1 !== s.readyState ? (delete this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]], 
        this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), this.internalBrokers.brokersAmount--, 
        this.publish(e, r, ++t)) : (s.send(Buffer.from(`${e}%${JSON.stringify({
            message: r
        })}`)), "#sendToWorkers" === e ? this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(r) : (this.middleware.onPublish && this.middleware.onPublish(e, r), 
        void this.channels.emitMany(e, r)));
    }
    broadcastMessage(e, r) {
        const t = (r = Buffer.from(r)).indexOf(37), s = r.slice(0, t).toString();
        if ("#sendToWorkers" === s) return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(JSON.parse(r.slice(t + 1)).message);
        if (!this.channels.exist(s)) return;
        const n = JSON.parse(r.slice(t + 1)).message;
        this.middleware.onPublish && this.middleware.onPublish(s, n), this.channels.emitMany(s, n);
    }
    setBroker(e, r) {
        this.internalBrokers.brokers[r] = e, this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers), 
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;
    }
}

function BrokerClient(e, r, t, s = 0, n) {
    let o = new UWebSocket(e);
    o.on("open", () => {
        s = 0, t.setBroker(o, e), n && logReady(`Broker has been connected to ${e} \n`), 
        o.send(r);
    }), o.on("error", i => {
        if (o = null, "uWs client connection error" === i.stack) return 5 === s && logWarning(`Can not connect to the Broker ${e}. System in reconnection state please check your Broker and URL \n`), 
        setTimeout(() => BrokerClient(e, r, t, ++s, n || s > 5), 500);
        logError(`Socket ${process.pid} has an issue: \n ${i.stack} \n`);
    }), o.on("close", n => {
        if (o = null, 4e3 === n) return logError("Can not connect to the broker wrong authorization key \n");
        logWarning(`Broker has disconnected, system is trying to reconnect to ${e} \n`), 
        setTimeout(() => BrokerClient(e, r, t, ++s, !0), 500);
    }), o.on("message", e => t.broadcastMessage("", e));
}

class Worker {
    constructor(e, r) {
        this.wss = new WSServer(), this.options = e;
        for (let e = 0; e < this.options.brokers; e++) BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[e]}`, r, this.wss);
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();
        const t = new UWebSocketServer({
            server: this.server,
            verifyClient: (e, r) => this.wss.middleware.verifyConnection ? this.wss.middleware.verifyConnection(e, r) : r(!0)
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

function BrokerServer(e, r, t, s) {
    let n;
    const o = {}, i = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    };
    if ("Scaler" === s && t && t.masterOptions && t.masterOptions.tlsOptions) {
        const r = HTTPS.createServer(t.masterOptions.tlsOptions);
        n = new UWebSocketServer({
            server: r
        }), r.listen(e, () => process.send({
            event: "READY",
            pid: process.pid
        }));
    } else n = new UWebSocketServer({
        port: e
    }, () => process.send({
        event: "READY",
        pid: process.pid
    }));
    function a(e, r) {
        for (let t = 0, s = Object.keys(o), n = s.length; t < n; t++) s[t] !== e && o[s[t]] && o[s[t]].send(r);
    }
    function l(e, r = "") {
        BrokerClient(e, r, {
            broadcastMessage: a,
            setBroker: (e, r) => {
                i.brokers[r] = e, i.brokersKeys = Object.keys(i.brokers), i.brokersAmount = i.brokersKeys.length;
            }
        });
    }
    n.on("connection", e => {
        e.isAuth = !1, e.authTimeOut = setTimeout(() => e.close(4e3, "Not Authenticated"), 5e3), 
        e.on("message", n => {
            if (n === r) {
                if (e.isAuth) return;
                return e.isAuth = !0, function e(r) {
                    r.id = generateKey(16);
                    if (o[r.id]) return e(r);
                    o[r.id] = r;
                }(e), clearTimeout(e.authTimeOut);
            }
            e.isAuth && (a(e.id, n), "Scaler" !== s && t && function e(r) {
                if (i.brokersAmount <= 0) return;
                i.nextBroker >= i.brokersAmount - 1 ? i.nextBroker = 0 : i.nextBroker++;
                const t = i.brokers[i.brokersKeys[i.nextBroker]];
                if (1 !== t.readyState) return delete i.brokers[i.brokersKeys[i.nextBroker]], i.brokersKeys = Object.keys(i.brokers), 
                i.brokersAmount--, e(r);
                t.send(r);
            }(n));
        }), e.on("close", (r, t) => {
            clearTimeout(e.authTimeOut), e.isAuth && (o[e.id] = null), e = null;
        });
    }), n.heartbeat(2e4), function() {
        if ("Scaler" === s || !t) return;
        t.masterOptions && l(`${t.masterOptions.tlsOptions ? "wss" : "ws"}://127.0.0.1:${t.masterOptions.port}`, t.key);
        for (let e = 0, r = t.brokersUrls.length; e < r; e++) l(t.brokersUrls[e], t.key);
    }();
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
            brokersPorts: e.brokersPorts || [],
            tlsOptions: e.tlsOptions || !1,
            pingInterval: e.pingInterval || 2e4,
            restartWorkerOnFail: e.restartWorkerOnFail || !1,
            horizontalScaleOptions: e.horizontalScaleOptions || !1,
            encodeDecodeEngine: e.encodeDecodeEngine || !1
        };
        if (isFunction(r.worker)) return logError("Worker param must be provided and it must be a function \n");
        if (!e.brokersPorts) for (let e = 0; e < r.brokers; e++) r.brokersPorts.push(e + 9400);
        if (r.brokersPorts.length !== r.brokers) return logError("Number of the broker ports can not be less than number of brokers \n");
        cluster.isMaster ? this.masterProcess(r) : this.workerProcess(r);
    }
    masterProcess(e) {
        let r = !1;
        const t = generateKey(16), s = {}, n = {};
        if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) o("Scaler", -1); else for (let r = 0; r < e.brokers; r++) o("Broker", r);
        function o(i, a) {
            let l = cluster.fork();
            l.on("message", t => "READY" === t.event && function(t, i, a) {
                if (r) return logReady(`${t} PID ${a} has been restarted`);
                "Worker" === t && (n[i] = `\tWorker: ${i}, PID ${a}`);
                if ("Scaler" === t) for (let r = 0; r < e.brokers; r++) o("Broker", r);
                if ("Broker" === t && (s[i] = `>>>  Broker on: ${e.brokersPorts[i]}, PID ${a}`, 
                Object.keys(s).length === e.brokers)) for (let r = 0; r < e.workers; r++) o("Worker", r);
                Object.keys(s).length === e.brokers && Object.keys(n).length === e.workers && (r = !0, 
                logReady(`>>>  Master on: ${e.port}, PID: ${process.pid} ${e.tlsOptions ? " (secure)" : ""}`), 
                Object.keys(s).forEach(e => s.hasOwnProperty(e) && logReady(s[e])), Object.keys(n).forEach(e => n.hasOwnProperty(e) && logReady(n[e])));
            }(i, a, t.pid)), l.on("exit", () => {
                l = null, logError(`${i} has exited \n`), e.restartWorkerOnFail && (logWarning(`${i} is restarting \n`), 
                o(i, a));
            }), l.send({
                securityKey: t,
                processId: a,
                processName: i
            });
        }
    }
    workerProcess(e) {
        process.on("message", r => {
            const t = {
                Worker: () => new Worker(e, r.securityKey),
                Broker: () => BrokerServer(e.brokersPorts[r.processId], r.securityKey, e.horizontalScaleOptions, "Broker"),
                Scaler: () => e.horizontalScaleOptions && BrokerServer(e.horizontalScaleOptions.masterOptions.port, e.horizontalScaleOptions.key || "", e.horizontalScaleOptions, "Scaler")
            };
            t[r.processName] && t[r.processName]();
        }), process.on("uncaughtException", e => (logError(`PID: ${process.pid}\n ${e.stack}\n`), 
        process.exit()));
    }
}

ClusterWS.uWebSocket = UWebSocket, ClusterWS.uWebSocketServer = UWebSocketServer, 
module.exports = ClusterWS, module.exports.default = ClusterWS;
