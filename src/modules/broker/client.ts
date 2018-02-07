import * as WebSocket from 'uws'
import { BrokerClientConfigs, Message } from '../../utils/interfaces'
import { logReady, logError, logWarning } from '../../utils/functions'

export function BrokerClient(configs: BrokerClientConfigs, reconnected?: boolean, tryiesOnConnectionError: number = 0): void {
    let websocket: WebSocket = new WebSocket(configs.url)
    websocket.on('open', () => {
        tryiesOnConnectionError = 0
        configs.broadcaster.setBroker(websocket, configs.url)
        if (reconnected) logReady('Broker has been connected to ' + configs.url + '\n')
        websocket.send(configs.key)
    })
    websocket.on('error', (err: Error): void | NodeJS.Timer => {
        if (err.stack === 'uWs client connection error') {
            websocket = null

            tryiesOnConnectionError > 5 &&
                logWarning('Can not connect to the Broker: ' + configs.url + '\n')

            return setTimeout(() => BrokerClient(configs,
                reconnected ||
                !configs.external ||
                tryiesOnConnectionError > 5, tryiesOnConnectionError > 5 ? 0 : ++tryiesOnConnectionError), 50)
        }
        logError('Socket ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n')
    })
    websocket.on('close', (code: number): void | NodeJS.Timer => {
        if (code === 4000) return logError('Can not connect to the broker wrong authorization key')
        websocket = null
        logWarning('Something went wrong,' + ' system is trying to reconnect to ' + configs.url + '\n')
        return setTimeout(() => BrokerClient(configs, true, ++tryiesOnConnectionError), 50)
    })
    websocket.on('message', (message: Message): void => message === '#0' ? websocket.send('#1') : configs.broadcaster.broadcastMessage('', message))
}