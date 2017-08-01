let _ = require('../utils/fp')
let common = require('../utils/common')

import { Options } from './options'

let on = _.curry((type: any, fn: any) => process.on(type, fn))

let msgHandler = _.curry((options: Options, msg: any) => _.switch({
    'initWorker': () => common.log('Init Worker'),
    'initBroker': () => common.log('Init Broker'),
    'default': () => common.log('default')
})(msg.type))

let errHandler = () => (err: any) => {
    common.log(err)
    process.exit()
}

let onMessage = _.compose(on('message'), msgHandler)
let onError = _.compose(on('uncaughtException'), errHandler)
module.exports = _.compose(onError, onMessage)
