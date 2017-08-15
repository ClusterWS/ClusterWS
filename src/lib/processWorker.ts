import { _ } from './utils/fp'
import { Worker } from './modules/worker/worker'
import { Broker } from './modules/broker/broker'
import { Options } from './options'
import { logError } from './utils/common'
import { processMessages } from './communication/messages'

declare let process: any

export function processWorker(options: Options) {
    process.on('message', (msg: { type: string, data?: any }) => _.switchcase({
        'worker': () => new Worker(options, msg.data),
        'broker': () => new Broker(options, msg.data)
    })(msg.type))

    process.on('uncaughtException', (err: any) => logError('PID: ' + process.pid + '\n' + err.stack + '\n'))
}