import * as HTTPS from 'https'

import { WebSocketServer } from '../uws/uws'

import { BrokerClient } from './client'
import { generateKey } from '../../utils/functions'
import { Message, CustomObject, HorizontalScaleOptions } from '../../utils/types'

export function BrokerServer(port: number, securityKey: string, horizontalScaleOptions: HorizontalScaleOptions | false, serverType: String): void {
  let server: WebSocketServer
  const clients: CustomObject = {}
  const globalBrokers: CustomObject = {
    brokers: {},
    nextBroker: -1,
    brokersKeys: [],
    brokersAmount: 0
  }

  if (serverType === 'Scaler' && horizontalScaleOptions && horizontalScaleOptions.masterOptions && horizontalScaleOptions.masterOptions.tlsOptions) {
    const httpsServer: HTTPS.Server = HTTPS.createServer(horizontalScaleOptions.masterOptions.tlsOptions)
    server = new WebSocketServer({ server: httpsServer })
    httpsServer.listen(port, () => process.send({ event: 'READY', pid: process.pid }))
  } else server = new WebSocketServer({ port }, (): void => process.send({ event: 'READY', pid: process.pid }))

  server.on('connection', (socket: CustomObject) => {
    socket.isAuth = false
    socket.authTimeOut = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)

    socket.on('message', (message: Message): void => {
      if (message === securityKey) {
        if (socket.isAuth) return
        socket.isAuth = true
        setSocketId(socket)
        return clearTimeout(socket.authTimeOut)
      }
      if (!socket.isAuth) return
      broadcast(socket.id, message)
      serverType !== 'Scaler' &&
        horizontalScaleOptions &&
        globalBroadcast(message)
    })

    socket.on('close', (code: number, reason: string) => {
      clearTimeout(socket.authTimeOut)
      if (socket.isAuth)
        clients[socket.id] = null
      socket = undefined
    })
  })

  server.keepAlive(20000)
  connectGlobalBrokers()

  function setSocketId(socket: CustomObject): void {
    socket.id = generateKey(16)
    if (clients[socket.id])
      return setSocketId(socket)
    clients[socket.id] = socket
  }

  function broadcast(id: string, message: Message): void {
    for (let i: number = 0, keys: string[] = Object.keys(clients), keysLength: number = keys.length; i < keysLength; i++)
      keys[i] !== id && clients[keys[i]] && clients[keys[i]].send(message)
  }

  function globalBroadcast(message: Message): void {
    if (globalBrokers.brokersAmount <= 0) return

    globalBrokers.nextBroker >= globalBrokers.brokersAmount - 1
      ? globalBrokers.nextBroker = 0
      : globalBrokers.nextBroker++

    const receiver: CustomObject = globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]]

    if (receiver.readyState !== 1) {
      delete globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]]
      globalBrokers.brokersKeys = Object.keys(globalBrokers.brokers)
      globalBrokers.brokersAmount--
      return globalBroadcast(message)
    }
    receiver.send(message)
  }

  function connectGlobalBrokers(): void {
    if (serverType === 'Scaler' || !horizontalScaleOptions) return

    horizontalScaleOptions.masterOptions &&
      createClient(`${horizontalScaleOptions.masterOptions.tlsOptions ? 'wss' : 'ws'}://127.0.0.1:${horizontalScaleOptions.masterOptions.port}`, horizontalScaleOptions.key)

    for (let i: number = 0, len: number = horizontalScaleOptions.brokersUrls.length; i < len; i++)
      createClient(horizontalScaleOptions.brokersUrls[i], horizontalScaleOptions.key)
  }

  function createClient(brokerUrl: string, key: string = ''): void {
    BrokerClient(brokerUrl, key, {
      broadcastMessage: broadcast,
      setBroker: (br: WebSocket, url: string): void => {
        globalBrokers.brokers[url] = br
        globalBrokers.brokersKeys = Object.keys(globalBrokers.brokers)
        globalBrokers.brokersAmount = globalBrokers.brokersKeys.length
      }
    })
  }
}