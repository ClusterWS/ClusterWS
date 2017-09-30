import { logReady } from './common/console'
import { processMessage } from './common/messages'
import { fork, Worker } from 'cluster'
import { Options, ProcessMessage } from './common/interfaces'

export function processMaster(options: Options): void {
    let count: number = 0
    const ready: string[] = []

    const isReady: any = (index: number, pid: number): void => {
        index === 0 ? ready[index] = '>>> Broker on: ' + options.brokerPort + ', PID ' + pid : ready[index] = '       Worker: ' + index + ', PID ' + pid
        if (count++ >= options.workers) {
            logReady('>>> Master on: ' + options.port + ', PID ' + process.pid)
            for (const i in ready) logReady(ready[i])
        }
    }

    const launch: any = (event: string, index: number): void => {
        const worker: Worker = fork()

        worker.on('message', (message: ProcessMessage): void => message.event === 'ready' ? isReady(index, message.data) : '')
        worker.on('exit', (): void => options.restartOnFail ? launch(event, index) : '')
        worker.send(processMessage(event, index))
    }

    launch('initBroker', 0)
    for (let i: number = 1; i <= options.workers; i++) launch('initWorker', i)
}