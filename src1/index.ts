import { isMaster } from 'cluster'
import { logError } from './modules/common/console'
import { processWorker } from './modules/worker.process'
import { processMaster } from './modules/master.process'
import { Options, UserOptions } from './modules/common/interfaces'

export class ClusterWS {
    constructor(configurations: UserOptions) {

        if (!configurations.worker) {
            logError('Worker must be provided')
            return
        }

        const options: Options = {
            port: configurations.port || 80,
            worker: configurations.worker,
            workers: configurations.workers || 1,
            brokerPort: configurations.brokerPort || 9346,
            pingInterval: configurations.pingInterval || 20000,
            restartOnFail: configurations.restartOnFail || false,
            sendInBinary: configurations
        }

        isMaster ? processMaster(options) : processWorker(options)
    }
}
