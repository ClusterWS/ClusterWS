let _ = require('../utils/fp')

import { Options } from './options'
import { processMessages } from './communication/messages'

let onExit = (data: any[]) => data[0].on('exit', data[1])
let fork: any = (cluster: any, options: Options, id?: number) => { return { cluster: cluster, process: cluster.fork(), options: options, id: id } }
let launchProcess: any = _.curry((type: string, data: any) => {
    data.process.send(processMessages(type, data.id))
    return [data.process, () => data.options.restartOnFail ? type === 'initBroker' ? launchBroker(data.cluster, data.options) : launchWorker(data.cluster, data.options, data.id) : '']
})

let launchBroker = _.compose(onExit, launchProcess('initBroker'), fork)
let launchWorker = _.compose(onExit, launchProcess('initWorker'), fork)

export function processMaster(options: Options, cluster: any) {
    launchBroker(cluster, options)
    for (let i = 0; i < options.workers; i++) launchWorker(cluster, options, i)
}