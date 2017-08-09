import * as _ from '../utils/fp'
import { log } from '../utils/common'
import { Options } from './options'
import { eventEmitter } from './modules/events/eventemitter'
import { broker } from './modules/broker/broker'

export function processWorker(options: Options) {
    let on = _.curry((type: any, fn: any) => process.on(type, fn))
    let msgHandler = _.curry((options: Options, msg: any) => _.switch({
        'initWorker': () => log('Init Worker'),
        'initBroker': () => broker(options),
        'default': () => log('default')
    })(msg.type))

    let errHandler = () => (err: any) => {
        log(err)
        process.exit()
    }

    let onMessage = _.compose(on('message'), msgHandler)
    let onError = _.compose(on('uncaughtException'), errHandler)
    return _.compose(onError, onMessage)(options)
}