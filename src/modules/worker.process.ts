import { Worker } from './main/worker/worker'
import { Broker } from './main/broker/broker'

import { logError } from './common/console'
import { Options, ProcessMessage } from './common/interfaces'

export function processWorker(options: Options): void {
    process.on('message', (message: ProcessMessage): any => {
        switch (message.event) {
            case 'initWorker': return new Broker(options, message.data)
            case 'initBroker': return new Worker(options, message.data)
        }
    })
    process.on('uncaughtException', (err: any): void => logError('PID: ' + process.pid + '\n' + err.stack + '\n'))
}