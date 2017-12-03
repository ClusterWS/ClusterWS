import { fork, Worker } from 'cluster'
import { IOptions, IObject, IProcessMessage, randomString, logWarning, logReady } from './utils/utils'

export function masterProcess(options: IOptions): void {
    let loadingCompleted: boolean = false
    const internalKey: string = randomString()
    const readyProcesses: IObject = {}

    options.machineScale && options.machineScale.master ? processLauncher('Scaler', -1) : processLauncher('Broker', 0)

    function processLauncher(name: string, id: number): void {
        const runProcess: Worker = fork()

        runProcess.send({ event: name, data: { internalKey, id } })
        runProcess.on('message', (message: IProcessMessage): void | string => message.event === 'READY' ? ready(id, message.data, name) : '')
        runProcess.on('exit', (): void => {
            logWarning(name + ' has been disconnected \n')
            if (options.restartWorkerOnFail) {
                logWarning(name + ' is restarting \n')
                processLauncher(name, id)
            }
        })
    }

    function ready(id: number, pid: number, name: string): void | string {
        if (loadingCompleted) return logReady(name + ' is restarted')
        if (id === -1) return processLauncher('Broker', 0)
        if (id === 0) {
            for (let i: number = 1; i <= options.workers; i++) processLauncher('Worker', i)
            return readyProcesses[id] = '>>> ' + name + ' on: ' + options.brokerPort + ', PID ' + pid
        }
        if (id !== 0) readyProcesses[id] = '       ' + name + ': ' + id + ', PID ' + pid
        if (Object.keys(readyProcesses).length === options.workers + 1) {
            loadingCompleted = true
            options.sslOptions ?
                logReady('>>> Master on: ' + options.port + ', PID: ' + process.pid + ', HTTPS: ' + options.sslOptions.port) :
                logReady('>>> Master on: ' + options.port + ', PID: ' + process.pid)

            for (const key in readyProcesses) readyProcesses[key] ? logReady(readyProcesses[key]) : ''
        }
    }
}