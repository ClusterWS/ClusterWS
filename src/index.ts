import * as cluster from 'cluster'
import { Worker } from './modules/worker/worker'
import { BrokerServer } from './modules/broker/server'
import { logReady, logError, logWarning, generateKey } from './utils/functions'
import { Configurations, Options, CustomObject, Message } from './utils/interfaces'

declare const process: any

export default class ClusterWS {
    constructor(configurations: Configurations) {
        if ({}.toString.call(configurations.worker) !== '[object Function]')
            return logError('Worker must be provided and it must be a function \n')

        const options: Options = {
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
            for (let i: number = 0; i < options.brokers; i++) options.brokersPorts.push(9400 + i)
        if (options.brokersPorts.length < options.brokers)
            return logError('Number of broker ports is less than number of brokers \n')

        cluster.isMaster ? this.masterProcess(options) : this.workerProcess(options)
    }

    private masterProcess(options: Options): void {
        let loaded: boolean = false
        const key: string = generateKey(16)
        const brokersReady: CustomObject = {}
        const workersReady: CustomObject = {}

        if (options.horizontalScaleOptions && options.horizontalScaleOptions.masterOptions)
            launchProcess('Scaler', -1)
        else for (let i: number = 0; i < options.brokers; i++)
            launchProcess('Broker', i)

        function launchProcess(processName: string, processId: number): void {
            let newProcess: cluster.Worker = cluster.fork()

            newProcess.on('message', (message: Message) =>
                message.event === 'READY' && ready(processName, processId, message.pid))
            newProcess.on('exit', () => {
                logError(processName + ' is closed \n')
                if (options.restartWorkerOnFail) {
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
                for (let i: number = 0; i < options.brokers; i++)
                    launchProcess('Broker', i)

            if (processName === 'Broker') {
                brokersReady[processId] = '>>>  Broker on: ' + options.brokersPorts[processId] + ', PID ' + pid
                if (Object.keys(brokersReady).length === options.brokers)
                    for (let i: number = 0; i < options.workers; i++)
                        launchProcess('Worker', i)
            }

            if (Object.keys(brokersReady).length === options.brokers && Object.keys(workersReady).length === options.workers) {
                loaded = true
                logReady('>>>  Master on: ' + options.port + ', PID: ' + process.pid + (options.tlsOptions ? ' (secure)' : ''))
                for (const indexKey in brokersReady) brokersReady[indexKey] && logReady(brokersReady[indexKey])
                for (const indexKey in workersReady) workersReady[indexKey] && logReady(workersReady[indexKey])
            }
        }
    }

    private workerProcess(options: Options): void {
        process.on('message', (message: Message): void => {
            const actions: CustomObject = {
                'Worker': (): void | Worker => new Worker(options, message.key),
                'Broker': (): void => BrokerServer({
                    key: message.key,
                    port: options.brokersPorts[message.processId],
                    horizontalScaleOptions: options.horizontalScaleOptions,
                    type: 'Broker'
                }),
                'Scaler': (): void => options.horizontalScaleOptions && BrokerServer({
                    key: options.horizontalScaleOptions.key || '',
                    port: options.horizontalScaleOptions.masterOptions.port,
                    horizontalScaleOptions: options.horizontalScaleOptions,
                    type: 'Scaler'
                })
            }
            return actions[message.processName] && actions[message.processName].call(null)
        })
        process.on('uncaughtException', (err: Error): void => {
            logError('PID: ' + process.pid + '\n' + err.stack + '\n')
            return process.exit()
        })
    }
}