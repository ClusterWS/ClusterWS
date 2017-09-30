import { processMaster } from './modules/process.master'
import { Options, UserOptions } from './modules/common/interfaces'

export class ClusteWS {
    constructor(configurations: UserOptions) {
        const options: Options = {
            port: configurations.port || 80,
            worker: configurations.worker,
            workers: configurations.workers || 1,
            brokerPort: configurations.brokerPort || 9346,
            pingInterval: configurations.pingInterval || 20000,
            restartOnFail: configurations.restartOnFail || false
        }
        processMaster(options)
    }
}
