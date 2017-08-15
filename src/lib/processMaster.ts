import * as cluster from 'cluster'

import { _ } from './utils/fp'
import { Options } from './options'
import { processMessages } from './communication/messages'
import { logRunning, count } from './utils/common'

/**
 * Create master process and spawn workers and a broker.
 * 
 * cluster.schedulingPolicy = cluster.SCHED_RR
 */
export function processMaster(options: Options) {
    let ready: string[] = []

    logRunning('>>> Master on: ' + options.port + ', PID ' + process.pid)

    let onReady = (id: number, pid: number) => {
        ready[id] = id === 0 ? '>>> Broker on: ' + options.brokerPort + ', PID ' + pid : '       Worker: ' + id + ', PID ' + pid
        if (count(ready) === options.workers + 1) _.map((print: any) => logRunning(print), ready)
    }

    let launch = (type: string, i: number) => {
        let server = cluster.fork()
        server.on('message', (msg: { type: string, data?: any }) => _.switchcase({
            'ready': () => onReady(i, msg.data)
        })(msg.type))
        server.on('exit', () => options.restartOnFail ? launch(type, i) : '')
        server.send(processMessages(type, i))
    }

    launch('broker', 0)
    for (let i: number = 1; i <= options.workers; i++) launch('worker', i)
}