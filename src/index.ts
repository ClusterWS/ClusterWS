import * as cluster from 'cluster'

import { Worker } from './modules/worker/worker'
import { Broker } from './modules/broker/broker'
import { CustomObject, Options, Configurations, logError, logWarning, logReady, randomString } from './utils/utils'

declare const process: any

export default class ClusterWS {
    constructor(configurations: Configurations) {
        if ({}.toString.call(configurations.worker) !== '[object Function]')
            return logError('Worker must be provided and it must be a function \n \n')

        const options: Options = {
            port: configurations.port || (configurations.tlsOptions ? 443 : 80),
            worker: configurations.worker,
            workers: configurations.workers || 1,
            useBinary: configurations.useBinary || false,
            brokerPort: configurations.brokerPort || 9346,
            tlsOptions: configurations.tlsOptions || false,
            scaleOptions: configurations.scaleOptions || false,
            pingInterval: configurations.pingInterval || 20000,
            restartWorkerOnFail: configurations.restartWorkerOnFail || false
        }
        cluster.isMaster ? ClusterWS.master(options) : ClusterWS.worker(options)
    }

    private static master(options: Options): void {
        let isReady: boolean = false

        const key: string = randomString(16)
        const processes: CustomObject = {}

        options.scaleOptions && options.scaleOptions.master ?
            launchProcess('Scaler', -1) : launchProcess('Broker', 0)

        function launchProcess(processName: string, processId: number): void {
            const runningProcess: cluster.Worker = cluster.fork()
            runningProcess.send({ processName, key })
            runningProcess.on('message', (message: CustomObject): void =>
                message.event === 'READY' && ready(processName, processId, message.pid))
            runningProcess.on('exit', (): void => {
                logWarning(processName + ' has been disconnected \n')
                if (options.restartWorkerOnFail) {
                    logWarning(processName + ' is restarting \n')
                    launchProcess(processName, processId)
                }
            })
        }

        function ready(processName: string, processId: number, pid: number): void {
            if (isReady) return logReady(processName + ' has restarted')
            if (processName === 'Scaler') return launchProcess('Broker', 0)
            if (processName === 'Broker') for (let i: number = 1; i <= options.workers; i++) launchProcess('Worker', i)

            processes[processId] = pid
            if (Object.keys(processes).length === options.workers + 1) {
                isReady = true
                logReady('>>> Master on: ' + options.port + ', PID: ' + process.pid + (options.tlsOptions ? ' (secure)' : ''))
                for (const index in processes)
                    processes[index] && index === '0' ?
                        logReady('>>> Broker on: ' + options.brokerPort + ', PID ' + processes[index]) :
                        logReady('       Worker: ' + index + ', PID ' + processes[index])
            }
        }
    }

    private static worker(options: Options): void {
        process.on('message', (message: CustomObject): void | Worker => {
            switch (message.processName) {
                case 'Worker':
                    return new Worker(options, message.key)
                case 'Broker':
                    return Broker.Server(options.brokerPort, message.key, options.scaleOptions)
                case 'Scaler':
                    return options.scaleOptions && Broker.Server(options.scaleOptions.port, options.scaleOptions.key || '')
            }
        })
        process.on('uncaughtException', (err: Error): void => logError('PID: ' + process.pid + '\n' + err.stack + '\n') && process.exit())
    }
}