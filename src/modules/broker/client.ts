import * as WebSocket from 'uws'
import { CustomObject, Message } from '../../utils/types'
import { logError, logWarning, logReady } from '../../utils/functions'

export function BrokerClient(url: string, securityKey: string, broadcaster: CustomObject, tries: number = 0, reconnected?: boolean): void {
  let websocket: WebSocket = new WebSocket(url)
  websocket.on('open', (): void => {
    broadcaster.setBroker(websocket, url)
    reconnected && logReady(`Broker has been connected to ${url} \n`)
    websocket.send(securityKey)
  })

  websocket.on('error', (err: Error): NodeJS.Timer => {
    websocket = undefined
    if (err.stack === 'uWs client connection error') {
      tries === 5 &&
        logWarning(`Can not connect to the Broker ${url}. System is in reconnection state please check your Broker and URL`)
      return setTimeout(() => BrokerClient(url, securityKey, broadcaster, ++tries, tries > 5), 50)
    }
    logError(`Socket ${process.pid} has an issue: \n ${err.stack} \n`)
  })

  websocket.on('close', (code: number): void => {
    websocket = undefined
    if (code === 4000)
      return logError('Can not connect to the broker wrong authorization key')
    logWarning(`Broker has disconnected, system is trying to reconnect to ${url} \n`)
    setTimeout(() => BrokerClient(url, securityKey, broadcaster, ++tries, true), 50)
  })

  websocket.on('message', (message: Message): void => message === '#0' ? websocket.send('#1') : broadcaster.broadcastMessage('', message))
}