import { logError } from './utils/common'

/**
 * Creates options object from
 * configurations provided by user.
 *
 * Default options:
 *
 * @param {number} port = 80
 * @param {number} workers = 1
 * @param {number} brokerPort = 9346
 * @param {number} pingPongInterval = 20000
 * @param {boolean} restartWorkerOnFail = false
 *
 */

export class Options {
    port: number
    worker: any
    workers: number
    brokerPort: number
    pingInterval: number
    restartWorkerOnFail: boolean

    constructor(configurations: any) {
        if (!configurations.worker) throw logError('Worker must be provided')

        this.port = configurations.port || 80
        this.worker = configurations.worker
        this.workers = configurations.workers || 1
        this.brokerPort = configurations.brokerPort || 9346
        this.pingInterval = configurations.pingInterval || 20000
        this.restartWorkerOnFail = configurations.restartWorkerOnFail || false
    }
}
