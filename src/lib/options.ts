/**
 * Creates options object from
 * configurations provided by user.
 *
 * Default options:
 *
 * @param {number} port = 3000
 * @param {number} workers = 1
 * @param {number} brokerPort = 9346
 * @param {number} pingPongInterval = 20000
 * @param {boolean} restartWorkerOnFail = false
 *
 * Configuration interface is needed to make
 * some options optional in TypeScript.
 */

export interface Configurations {
    port?: number,
    worker?: any
    workers?: number,
    brokerPort?: number,
    pingInterval?: number
    restartWorkerOnFail?: boolean,

}

export class Options {
    id: number;
    port: number;
    worker: any;
    workers: number;
    brokerPort: number;
    pingInterval: number;
    restartWorkerOnFail: boolean;

    constructor(configurations: Configurations) {
        if (!configurations.worker) {
            throw '\n\x1b[31mWorker function must be provided\x1b[0m';
        }
        this.port = configurations.port || 3000;
        this.worker = configurations.worker;
        this.workers = configurations.workers || 1;
        this.brokerPort = configurations.brokerPort || 9346;
        this.pingInterval = configurations.pingInterval || 20000;
        this.restartWorkerOnFail = configurations.restartWorkerOnFail || false;
    }
}
