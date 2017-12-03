import { isMaster } from 'cluster'
import { masterProcess } from './modules/master.process'
import { workerProcess } from './modules/worker.process'
import { IUserOptions, IOptions, logError } from './modules/utils/utils'

export class ClusterWS {
    constructor(configuration: IUserOptions) {
        if ({}.toString.call(configuration.worker) !== '[object Function]')
            return logError('Worker must be provided and it must be a function \n \n')

        const options: IOptions = {
            port: configuration.port || 80,
            worker: configuration.worker,
            workers: configuration.workers || 1,
            brokerPort: configuration.brokerPort || 9346,
            pingInterval: configuration.pingInterval || 20000,
            restartWorkerOnFail: configuration.restartWorkerOnFail || false,
            useBinary: configuration.useBinary || false,
            secureProtocolOptions: configuration.secureProtocolOptions ? {
                port: configuration.secureProtocolOptions.port || 443,
                key: configuration.secureProtocolOptions.key,
                cert: configuration.secureProtocolOptions.cert,
                ca: configuration.secureProtocolOptions.ca
            } : false,
            machineScale: configuration.machineScale
        }
        isMaster ? masterProcess(options) : workerProcess(options)
    }
}