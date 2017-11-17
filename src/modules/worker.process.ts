import { logError } from './utils/logs'
import { IOptions, IProcessMessage } from './utils/interfaces'
import { Broker } from './broker/broker'

declare let process: any
export function workerProcess(options: IOptions): void {
    process.on('message', (message: IProcessMessage): void => {
        switch (message.event) {
            case 'Broker': return Broker.server(options, message.data)
            case 'Worker': return
        }
    })

    process.on('uncaughtException', (err: any): void => {
        logError('PID: ' + process.pid + '\n' + err.stack + '\n')
        if (options.restartWorkerOnFail) return process.exit()
    })
}