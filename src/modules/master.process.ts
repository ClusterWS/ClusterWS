import { logReady } from './common/console'
import { processMessage } from './common/messages'
import { fork, Worker } from 'cluster'
import { Options, ProcessMessage } from './common/interfaces'

export function processMaster(options: Options): void {
    let count: number = 0
    const ready: string[] = []

    const launch: any = (event: string, index: number): void => {
        const worker: Worker = fork()

        worker.on('message', (message: ProcessMessage): void => message.event === 'ready' ? isReady(index, message.data) : '')
        worker.on('exit', (): void => options.restartOnFail ? launch(event, index) : '')
        worker.send(processMessage(event, index))
    }

    const isReady: any = (index: number, pid: number): void => {
        index === 0 ? ((): void => {
            for (let i: number = 1; i <= options.workers; i++) launch('initWorker', i)
            ready[index] = '>>> Broker on: ' + options.brokerPort + ', PID ' + pid
        })() : ready[index] = '       Worker: ' + index + ', PID ' + pid

        if (count++ >= options.workers) {
            logReady('>>> Master on: ' + options.port + ', PID ' + process.pid)
            for (const i in ready) logReady(ready[i])
        }
    }

    launch('initBroker', 0)
}