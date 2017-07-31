let _ = require('../utils/fp')
let common = require('../utils/common')

import { Options } from './options'

let messageHandler = (options: Options) => (msg: any) => {
    switch (msg.type) {
        case 'initBroker':
            return common.log('Init Broker')
        case 'initWorker':
            return common.log('Init Worker')
        default: break
    }
}

let errorHandler = (options: Options) => (err: any) => {
    console.log(err)
    process.exit()
}

let onError = _.compose(common.on('uncaughtException'), errorHandler)
let onMessage = _.compose(common.on('message'), messageHandler)
let processWorker = _.compose(onError, onMessage)

module.exports = processWorker
