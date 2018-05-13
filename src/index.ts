import * as cluster from 'cluster'

import { Worker } from './modules/worker'
import { BrokerServer } from './modules/broker/server'
import { logReady, logWarning, logError, generateKey, isFunction } from './utils/functions'
import { Configurations, Options, CustomObject, Message } from './utils/types'

import { UWebSocket } from './modules/uws/uws.client'
import { UWebSocketServer } from './modules/uws/uws.server'

declare const process: any

export default class ClusterWS {
  public static uWebSocket: any = UWebSocket
  public static uWebSocketServer: any = UWebSocketServer

  constructor(configurations: Configurations) {
    const options: Options = {
      port: configurations.port || (configurations.tlsOptions ? 443 : 80),
      host: configurations.host || null,
      worker: configurations.worker,
      workers: configurations.workers || 1,
      brokers: configurations.brokers || 1,
      useBinary: configurations.useBinary || false,
      brokersPorts: configurations.brokersPorts || [],
      tlsOptions: configurations.tlsOptions || false,
      pingInterval: configurations.pingInterval || 20000,
      restartWorkerOnFail: configurations.restartWorkerOnFail || false,
      horizontalScaleOptions: configurations.horizontalScaleOptions || false,
      encodeDecodeEngine: configurations.encodeDecodeEngine || false
    }

    if (!isFunction(options.worker))
      return logError('Worker param must be provided and it must be a function \n')

    if (!configurations.brokersPorts)
      for (let i: number = 0; i < options.brokers; i++) options.brokersPorts.push(i + 9400)

    if (options.brokersPorts.length !== options.brokers)
      return logError('Number of broker ports should be the same as number of brokers\n')

    cluster.isMaster ? this.masterProcess(options) : this.workerProcess(options)
  }

  private masterProcess(options: Options): void {
    let isReady: boolean = false
    const securityKey: string = generateKey(16)
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
        newProcess = null
        logError(`${processName} has exited \n`)
        if (options.restartWorkerOnFail) {
          logWarning(`${processName} is restarting \n`)
          launchProcess(processName, processId)
        }
      })

      newProcess.send({ securityKey, processId, processName })
    }

    function ready(processName: string, processId: number, pid: number): void {
      if (isReady)
        return logReady(`${processName} PID ${pid} has been restarted`)

      if (processName === 'Worker')
        workersReady[processId] = `\tWorker: ${processId}, PID ${pid}`

      if (processName === 'Scaler')
        for (let i: number = 0; i < options.brokers; i++)
          launchProcess('Broker', i)

      if (processName === 'Broker') {
        brokersReady[processId] = `>>>  Broker on: ${options.brokersPorts[processId]}, PID ${pid}`
        if (Object.keys(brokersReady).length === options.brokers)
          for (let i: number = 0; i < options.workers; i++)
            launchProcess('Worker', i)
      }

      if (Object.keys(brokersReady).length === options.brokers && Object.keys(workersReady).length === options.workers) {
        isReady = true
        logReady(`>>>  Master on: ${options.port}, PID: ${process.pid} ${options.tlsOptions ? ' (secure)' : ''}`)
        Object.keys(brokersReady).forEach((key: string) => brokersReady.hasOwnProperty(key) && logReady(brokersReady[key]))
        Object.keys(workersReady).forEach((key: string) => workersReady.hasOwnProperty(key) && logReady(workersReady[key]))
      }
    }
  }

  private workerProcess(options: Options): void {
    process.on('message', (message: Message): void => {
      const actions: CustomObject = {
        Worker: (): Worker => new Worker(options, message.securityKey),
        Broker: (): void => BrokerServer(options.brokersPorts[message.processId], message.securityKey, options.horizontalScaleOptions, 'Broker'),
        Scaler: (): void => options.horizontalScaleOptions &&
          BrokerServer(options.horizontalScaleOptions.masterOptions.port, options.horizontalScaleOptions.key || '', options.horizontalScaleOptions, 'Scaler')
      }
      actions[message.processName] && actions[message.processName]()
    })

    process.on('uncaughtException', (err: Error): void => {
      logError(`PID: ${process.pid}\n ${err.stack}\n`)
      return process.exit()
    })
  }
}