import * as cluster from 'cluster'
import { logReady, logError, logWarning, generateKey } from './utils/functions'
import { Configurations, Options, CustomObject, Message } from './utils/interfaces'

declare const process: any

export default class ClusterWS {
    private options: Options

    constructor(configurations: Configurations) {
        if ({}.toString.call(configurations.worker) !== '[object Function]')
            return logError('Worker must be provided and it must be a function \n')

        this.options = {
            port: configurations.port || (configurations.tlsOptions ? 443 : 80),
            worker: configurations.worker,
            workers: configurations.workers || 1,
            brokers: configurations.brokers || 1,
            useBinary: configurations.useBinary || false,
            brokersPorts: configurations.brokersPorts || [],
            tlsOptions: configurations.tlsOptions || false,
            pingInterval: configurations.pingInterval || 20000,
            restartWorkerOnFail: configurations.restartWorkerOnFail || false,
            horizontalScaleOptions: configurations.horizontalScaleOptions || false
        }

        if (!configurations.brokersPorts)
            for (let i: number = 0; i < this.options.brokers; i++) this.options.brokersPorts.push(9400 + i)
        if (this.options.brokersPorts.length < this.options.brokers)
            return logError('Number of broker ports is less than number of brokers \n')

        cluster.isMaster ? this.masterProcess() : this.workerProcess()
    }

    private masterProcess(): void {
        let loaded: boolean = false
        const key: string = generateKey(16)
        const brokersReady: CustomObject = {}
        const workersReady: CustomObject = {}

        if (this.options.horizontalScaleOptions && this.options.horizontalScaleOptions.masterOptions)
            launchProcess('Scaler', -1)
        else for (let i: number = 0; i < this.options.brokers; i++)
            launchProcess('Broker', i)

        function launchProcess(processName: string, processId: number): void {
            let newProcess: cluster.Worker = cluster.fork()

            newProcess.on('message', (message: Message) =>
                message.event === 'READY' && ready(processName, processId, message.pid))
            newProcess.on('exit', () => {
                logError(processName + ' is closed \n')
                if (this.options.restartWorkerOnFail) {
                    logWarning(processName + ' is restarting \n')
                    launchProcess(processName, processId)
                }
                newProcess = null
            })
            newProcess.send({ key, processId, processName })
        }

        function ready(processName: string, processId: number, pid: number): void {
            if (loaded)
                return logReady(processName + ' PID ' + pid + ' has restarted')

            if (processName === 'Worker')
                workersReady[processId] = '\tWorker: ' + processId + ', PID ' + pid

            if (processName === 'Scaler')
                for (let i: number = 0; i < this.options.brokers; i++)
                    launchProcess('Broker', i)

            if (processName === 'Broker') {
                brokersReady[processId] = '>>>  Broker on: ' + this.options.brokersPorts[processId] + ', PID ' + pid
                if (Object.keys(brokersReady).length === this.options.brokers)
                    for (let i: number = 0; i < this.options.workers; i++)
                        launchProcess('Worker', i)
            }

            if (Object.keys(brokersReady).length === this.options.brokers && Object.keys(workersReady).length === this.options.workers) {
                loaded = true
                logReady('>>>  Master on: ' + this.options.port + ', PID: ' + process.pid + (this.options.tlsOptions ? ' (secure)' : ''))
                for (const indexKey in brokersReady) brokersReady[indexKey] && logReady(brokersReady[indexKey])
                for (const indexKey in workersReady) workersReady[indexKey] && logReady(workersReady[indexKey])
            }
        }
    }

    private workerProcess(): void {
        process.on('message', (message: Message): void => {
            switch (message.processName) {
                case 'Broker':
                case 'Worker':
                case 'Scaler':
            }
        })
        process.on('uncaughtException', (err: Error): void => {
            logError('PID: ' + process.pid + '\n' + err.stack + '\n')
            return process.exit()
        })
    }
}