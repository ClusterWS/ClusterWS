import * as _ from '../utils/fp'
import { log } from '../utils/common'
import { Options } from './options'
import { eventEmitter } from './modules/events/eventemitter'

export function processWorker(options: Options) {
    let on = _.curry((type: any, fn: any) => process.on(type, fn))
    let msgHandler = _.curry((options: Options, msg: any) => _.switch({
        'initWorker': () => log('Init Worker'),
        'initBroker': () => {
            let x = eventEmitter()
            let test = (data: any) => {
                console.log('event executed ', data)
            }
            x.on('event', test)
            x.on('event', () => { })
            x.removeListener('event', test)
            let y = eventEmitter()

            x.emit('event', 'hello')
            y.on('event', () => {
                console.log('is y')
            })
            y.emit('event')
            x.emit('event', 'hello')

            log('Init Broker')
        },
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