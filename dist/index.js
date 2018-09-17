"use strict";

var crypto = require("crypto"), cluster = require("cluster");

function logError(e) {
    return process.stdout.write(`[31mError PID ${process.pid}:[0m  ${e}\n`);
}

function isFunction(e) {
    return "[object Function]" === {}.toString.call(e);
}

function generateKey(e) {
    return crypto.randomBytes(e).toString("hex");
}

class EventEmitterMany {
    constructor() {
        this.events = {};
    }
    on(e, t, r) {
        if (!isFunction(t)) return logError("Listener must be a function");
        this.events[e] ? this.events[e].push({
            token: r,
            listener: t
        }) : (this.events[e] = [ {
            token: r,
            listener: t
        } ], this.action("create", e));
    }
    emit(e, ...t) {
        const r = this.events[e];
        if (r) for (let o = 0, s = r.length; o < s; o++) r[o].listener(e, ...t);
    }
    removeByListener(e, t) {
        const r = this.events[e];
        if (r) {
            for (let e = 0, o = r.length; e < o; e++) if (r[e].listener === t) {
                r.splice(e, 1);
                break;
            }
            r.length || (delete this.events[e], this.action("destroy", e));
        }
    }
    removeByToken(e, t) {
        const r = this.events[e];
        if (r) {
            for (let e = 0, o = r.length; e < o; e++) if (r[e].token === t) {
                r.splice(e, 1);
                break;
            }
            r.length || (delete this.events[e], this.action("destroy", e));
        }
    }
    action(e, t) {}
}

function masterProcess(e) {
    const t = generateKey(20), r = generateKey(20);
    if (e.horizontalScaleOptions && e.horizontalScaleOptions.masterOptions) o("Scaler", -1); else for (let t = 0; t < e.brokers; t++) o("Broker", t);
    function o(s, n) {
        const i = cluster.fork();
        i.on("message", e => {}), i.on("exit", () => {
            logError(`${s} has exited`), e.restartWorkerOnFail && o(s, n);
        }), i.send({
            processId: n,
            processName: s,
            serverId: t,
            internalSecurityKey: r
        });
    }
}

function workerProcess(e) {}

class ClusterWS {
    constructor(e) {
        const t = new EventEmitterMany();
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
        }, !this.options.brokersPorts.length) for (let e = 0; e < this.options.brokers; e++) this.options.brokersPorts.push(e + 9400), 
        t.emit("hello");
        return isFunction(this.options.worker) ? this.options.brokers !== this.options.brokersPorts.length ? logError("Number of broker ports should be the same as number of brokers") : void (cluster.isMaster ? masterProcess(this.options) : workerProcess(this.options)) : logError("Worker must be provided and it must be a function");
    }
}

module.exports = ClusterWS; module.exports.default = ClusterWS;
