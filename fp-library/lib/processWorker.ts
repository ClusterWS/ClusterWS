import * as _ from '../utils/fp'
import { log, logError } from '../utils/common'
import { Options } from './options'
import { eventEmitter } from './modules/events/eventemitter'
import { broker } from './modules/broker/broker'
import { worker } from './modules/worker/worker'

export function processWorker(options: Options) {
    let on = _.curry((type: any, fn: any) => process.on(type, fn))
    let msgHandler = _.curry((options: Options, msg: any) => _.switch({
        'initWorker': () => worker(options),
        'initBroker': () => broker(options),
        'default': () => log('default')
    })(msg.type))

    let errHandler = () => (err: any) => {
        logError(err)
        process.exit()
    }

    let onMessage = _.compose(on('message'), msgHandler)
    let onError = _.compose(on('uncaughtException'), errHandler)
    return _.compose(onError, onMessage)(options)
}