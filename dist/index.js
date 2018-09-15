"use strict";

class ClusterWS {
    constructor(r) {
        this.options = {
            port: r.port || (r.tlsOptions ? 443 : 80),
            host: r.host,
            worker: r.worker,
            workers: r.workers || 1,
            brokers: r.brokers || 1,
            useBinary: r.useBinary,
            tlsOptions: r.tlsOptions,
            pingInterval: r.pingInterval || 2e4,
            brokersPorts: r.brokersPorts || [],
            encodeDecodeEngine: r.encodeDecodeEngine,
            restartWorkerOnFail: r.restartWorkerOnFail,
            horizontalScaleOptions: r.horizontalScaleOptions
        };
    }
}

module.exports = ClusterWS; module.exports.default = ClusterWS;
