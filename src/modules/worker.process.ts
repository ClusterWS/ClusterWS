import { Worker } from './worker/worker'
import { Broker } from './broker/broker'
import { IOptions, IProcessMessage, logError } from './utils/utils'

export function workerProcess(options: IOptions): void {
    process.on('message', (message: IProcessMessage): void | string | Worker => {
        switch (message.event) {
            case 'Worker': return new Worker(options, message.data)
            case 'Broker': return Broker.Server(options.brokerPort, {
                key: message.data.internalKey,
                machineScale: options.machineScale
            })
            case 'Scaler': return options.machineScale ? Broker.Server(options.machineScale.port, { key: options.machineScale.securityKey || '' }) : ''
        }
    })

    process.on('uncaughtException', (err: Error): void => {
        logError('PID: ' + process.pid + '\n' + err.stack + '\n')
        return process.exit()
    })
}