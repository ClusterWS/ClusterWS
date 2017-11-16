import { isMaster } from 'cluster'
import { logError } from './modules/utils/logs'
import { masterProcess } from './modules/master.process'
import { IOptions, IPassedOptions } from './modules/utils/interfaces'

export class ClusterWS {
    constructor(configurations: IPassedOptions) {
        if (!configurations.worker || {}.toString.call(configurations.worker) !== '[object Function]')
            return logError('Worker must be provided and it must be a function \n \n')

        const options: IOptions = {
            port: configurations.port || 80,
            worker: configurations.worker,
            workers: configurations.workers || 1,
            brokerPort: configurations.brokerPort || 9346,
            pingInterval: configurations.pingInterval || 20000,
            restartOnFail: configurations.restartOnFail || false
        }

        isMaster ? masterProcess(options) : ''
    }
}