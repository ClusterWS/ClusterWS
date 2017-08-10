import * as cluster from 'cluster'
import { _ } from './utils/fp'
import { Options } from './options'
import { logRunning } from './utils/logs'
import { processMessages } from './communication/messages'

/**
 * Create master process and spawn workers and broker.
 * 
 * cluster.schedulingPolicy = cluster.SCHED_RR;
 */
export function processMaster(options: Options) {
    let ready: number[] = [];
    logRunning('>>> Master on: ' + options.port + ', PID ' + process.pid)

    let readyPrint = (type: string, id: number, pid: number) => {
        if (id === 0) return logRunning('>>> Broker on: ' + options.brokerPort + ', PID ' + pid)
        ready[id--] = pid
        if (ready.length === options.workers) ready.map((pid, index) => logRunning('          Worker: ' + (index + 1) + ', PID ' + pid))
    }

    let launch = (type: string, i: number) => {
        let server = cluster.fork()
        server.on('message', (msg: { type: string, data?: any }) => {
            _.switchcase({
                'ready': () => readyPrint(type, i, msg.data),
                'default': ''
            })(msg.type)
        })
        server.on('exit', () => options.restartWorkerOnFail ? launch(type, i) : '')
        server.send(processMessages(type, i))
    }

    launch('broker', 0)
    for (let i: number = 1; i <= options.workers; i++) launch('worker', i)
}