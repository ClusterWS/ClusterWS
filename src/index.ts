import * as cluster from 'cluster'
import { CustomObject, Configurations, Options, Message, logReady, logError, logWarning, generateKey } from './utils/utils'

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

        cluster.isMaster ? MasterProcess(options) : WorkerProcess(options)
    }
}

function MasterProcess(options: Options): void {
    let loading: boolean = true

    const key: string = generateKey(16)
    const brokersReady: CustomObject = {}
    const workersReady: CustomObject = {}

    if (options.horizontalScaleOptions)
        launchProcess('Scaler', -1)
    else for (let i: number = 0; i < options.brokers; i++) launchProcess('Broker', i)

    function launchProcess(processName: string, processID: number): void {
        let newProcess: cluster.Worker = cluster.fork()
        newProcess.on('message', (message: Message) => message.event === 'READY' && ready(processName, processID, message.pid))
        newProcess.on('exit', (): void => {
            logError(processName + ' has been disconnected \n')
            if (options.restartWorkerOnFail) {
                logWarning(processName + ' is restarting \n')
                launchProcess(processName, processID)
            }
            newProcess = null
        })
        newProcess.send({ key, processID, processName })
    }

    function ready(processName: string, processID: number, pid: number): void {
        if (!loading) return logReady(processName + ' PID ' + pid + ' has restarted')

        if (processName === 'Worker') workersReady[processID] = '       Worker: ' + processID + ', PID ' + pid
        if (processName === 'Scaler')
            for (let i: number = 0; i < options.brokers; i++) launchProcess('Broker', i)
        if (processName === 'Broker') {
            brokersReady[processID] = '>>> Broker on: ' + options.brokersPorts[processID] + ', PID ' + pid
            if (Object.keys(brokersReady).length === options.brokers)
                for (let i: number = 0; i < options.workers; i++) launchProcess('Worker', i)
        }
        if (Object.keys(brokersReady).length === options.brokers && Object.keys(workersReady).length === options.workers) {
            loading = false
            logReady('>>> Master on: ' + options.port + ', PID: ' + process.pid + (options.tlsOptions ? ' (secure)' : ''))
            for (const indexKey in brokersReady) brokersReady[indexKey] && logReady(brokersReady[indexKey])
            for (const indexKey in workersReady) workersReady[indexKey] && logReady(workersReady[indexKey])
        }
    }
}

function WorkerProcess(options: Options): void {
    process.on('message', (message: Message): void | Worker => {
        
    })

    process.on('uncaughtException', (err: Error): void => {
        logError('PID: ' + process.pid + '\n' + err.stack + '\n')
        return process.exit()
    })
}