import { Broker } from './broker/broker'
import { Worker } from './worker/worker'
import { IOptions, IProcessMessage, logError } from './utils/utils'

export function workerProcess(options: IOptions): void {
    process.on('message', (message: IProcessMessage): any => {
        switch (message.event) {
            case 'Broker': return Broker.Server(options.brokerPort, {
                key: message.data.internalKey,
                machineScale: options.machineScale
            })
            case 'Worker': return new Worker(options, message.data)
            case 'Scaler': return options.machineScale ? Broker.Server(options.machineScale.port, { key: options.machineScale.externalKey || '' }) : ''
        }
    })

    process.on('uncaughtException', (err: any): void => {
        logError('PID: ' + process.pid + '\n' + err.stack + '\n')
        if (options.restartWorkerOnFail) return process.exit()
    })
}