import { _ } from './utils/fp'
import { Worker } from './modules/worker';
import { Broker } from './modules/pubsub-server/broker';
import { Options } from './options';
import { logError } from './utils/logs'
import { processMessages } from './communication/messages';

declare let process: any

export function processWorker(options: Options) {
    process.on('message', (msg: { type: string, data?: any }) => _.switchcase({
        'worker': () => {
            new Worker(options)
            process.send(processMessages('ready', process.pid))
        },
        'broker': () => {
            new Broker(options)
            process.send(processMessages('ready', process.pid))
        },
        'default': ''
    })(msg.type))

    process.on('uncaughtException', (err: any) => {
        logError('PID: ' + process.pid + '\n' + err.stack + '\n')
    })
}
