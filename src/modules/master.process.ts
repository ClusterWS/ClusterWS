import { fork, Worker } from 'cluster'
import { logReady, logWarning } from './utils/logs'
import { IOptions, IProcessMessage } from './utils/interfaces'

export function masterProcess(options: IOptions): void {
    let hasCompleted: boolean = false
    const readyProcesses: any = {}
    const internalKey: string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    launchProcess('Broker', 0)
    function launchProcess(processName: string, index: number): void {
        const process: Worker = fork()

        process.on('exit', (): void => {
            logWarning(processName + ' has been disconnected \n')
            if (options.restartOnFail) {
                logWarning(processName + ' is restarting \n')
                launchProcess(processName, index)
            }
        })
        process.on('message', (message: IProcessMessage): any => message.event === 'Ready' ? isReady(index, message.data, processName) : '')
        process.send({ name: processName, data: { internalKey, index } })
    }

    function isReady(index: number, pid: number, processName: string): void | string {
        if (hasCompleted) {
            readyProcesses[index] = '       ' + processName + ': ' + index + ', PID: ' + pid
            return logReady(processName + ' has been restarted')
        } else if (index === 0) {
            for (let i: number = 1; i <= options.workers; i++) launchProcess('Worker', i)
            return readyProcesses[index] = '>>> ' + processName + ' on: ' + options.brokerPort + ', PID ' + pid
        } else if (Object.keys(readyProcesses).length === options.workers) {
            hasCompleted = true
            logReady('>>> Master on: ' + options.port + ', PID: ' + process.pid)
            for (const key in readyProcesses) if (readyProcesses[key]) logReady(readyProcesses[key])
        }
    }
}