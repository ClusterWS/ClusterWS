import { logError } from './common/console'
import { Options, ProcessMessage } from './common/interfaces'

export function processWorker(options: Options): void {
    process.on('message', (message: ProcessMessage): void => {
        switch (message.event) {
            case 'initBroker':
                break
            case 'initWorker':
                break
        }
    })

    process.on('uncaughtException', (err: any): void => logError('PID: ' + process.pid + '\n' + err.stack + '\n'))
}