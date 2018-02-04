import * as WebSocket from 'uws'
import { BrokerClientConfigs, Message } from '../../utils/interfaces'
import { logReady, logError, logWarning } from '../../utils/functions'

export function BrokerClient(configs: BrokerClientConfigs, reconnected?: boolean, tryiesOnConnectionError: number = 0): void {
    let websocket: WebSocket = new WebSocket(configs.url)
    websocket.on('open', () => {
        tryiesOnConnectionError = 0
        configs.broadcaster.setBroker(websocket, configs.url)
        if (reconnected) logReady('Broker\'s socket has been connected to ' + configs.url)
        websocket.send(configs.key)
    })
    websocket.on('error', (err: Error): void | NodeJS.Timer => {
        if (err.stack === 'uWs client connection error') {
            websocket = null
            tryiesOnConnectionError > 10 && logWarning('Can not connect to the Broker: ' + configs.url)
            return setTimeout(() => BrokerClient(configs, !configs.external || tryiesOnConnectionError > 10, tryiesOnConnectionError++), 20)
        }
        logError('Socket ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n')
    })
    websocket.on('close', (code: number): void | NodeJS.Timer => {
        if (code === 4000) return logError('Wrong authorization key')
        websocket = null
        logWarning('Something went wrong,' + (configs.external ? ' external ' : ' ') + 'socket is trying to reconnect')
        return setTimeout(() => BrokerClient(configs, true, tryiesOnConnectionError++), 20)
    })
    websocket.on('message', (message: Message): void => message === '#0' ? websocket.send('#1') : configs.broadcaster.broadcastMessage('', message))
}