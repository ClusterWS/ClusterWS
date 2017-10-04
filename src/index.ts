import { isMaster } from 'cluster'
import { processWorker } from './modules/worker.process'
import { processMaster } from './modules/master.process'
import { Options, UserOptions } from './modules/common/interfaces'

export class ClusterWS {
    private static instance: ClusterWS

    constructor(configurations: UserOptions) {
        if (ClusterWS.instance) return
        ClusterWS.instance = this

        const options: Options = {
            port: configurations.port || 80,
            worker: configurations.worker,
            workers: configurations.workers || 1,
            brokerPort: configurations.brokerPort || 9346,
            pingInterval: configurations.pingInterval || 20000,
            restartOnFail: configurations.restartOnFail || false
        }
        isMaster ? processMaster(options) : processWorker(options)
    }
}
