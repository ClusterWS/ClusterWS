let _ = require('../utils/fp')
let common = require('../utils/common')

import { Options } from './options'
import { processMessages } from './communication/messages'

let fork: any = (cluster: any) => cluster.fork()
let sendMessage: any = _.curry((type: string, to: any) => to.send(processMessages(type)))
let onExit = _.compose(common.on('exit'), () => (err: any) => common.log(err))

let launchBroker = _.compose(onExit, sendMessage('initBroker'), fork)
let launchWorker = _.compose(onExit, sendMessage('initWorker'), fork)

export function processMaster(options: Options, cluster: any) {
    launchBroker(cluster)
    for(let i = 0 ; i < options.workers; i++) launchWorker(cluster)
} 