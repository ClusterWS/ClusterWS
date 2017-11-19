import { logError } from './utils/logs'
import { IOptions, IProcessMessage } from './utils/interfaces'
import { Broker } from './broker/broker'
import { Worker } from './worker/worker'

export function workerProcess(options: IOptions): void {
    process.on('message', (message: IProcessMessage): any => {
        switch (message.event) {
            case 'Broker': return Broker.Server(options, message.data)
            case 'Worker': return new Worker(options, message.data)
        }
    })

    process.on('uncaughtException', (err: any): void => {
        logError('PID: ' + process.pid + '\n' + err.stack + '\n')
        if (options.restartWorkerOnFail) return process.exit()
    })
}