
import * as WebSocket from 'uws'
import { SocketServer } from '../worker/socket/server'
import { TSocketMessage, IObject, logReady, logError, logWarning, randomString } from '../utils/utils'

declare const process: any

export class Broker {
    public static Client(url: string, key: string, broadcaster: SocketServer | any, isReconnected?: boolean): void {
        const websocket: WebSocket = new WebSocket(url)

        websocket.on('message', (message: TSocketMessage): void => message === '#0' ? websocket.send('#1') : broadcaster.broadcastMessage('', message))
        websocket.on('open', (): void => {
            if (isReconnected) logReady('Socket has been reconnected')
            websocket.send(key)
        })
        websocket.on('error', (err: Error): void => {
            if (err.stack === 'uWs client connection error') return Broker.Client(url, key, broadcaster, true)
            logError('Socket ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n')
        })
        websocket.on('close', (code: number, reason: string): void => {
            if (code === 4000) return logError('Wrong or no authenticated key was provided')
            logWarning('Something went wrong, socket will be reconnected as soon as possible')
            Broker.Client(url, key, broadcaster, true)
        })
        broadcaster.setBroker(websocket)
    }

    public static Server(port: number, serverConfigs: IObject): void {
        let externalBroker: IObject
        const sockets: IObject[] = []
        const brokerServer: WebSocket.Server = new WebSocket.Server({ port }, (): void => process.send({ event: 'READY', data: process.pid }))

        brokerServer.on('connection', (socket: IObject): void => {
            let authenticated: boolean = false
            const timeout: NodeJS.Timer = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)
            const interval: NodeJS.Timer = setInterval((): void => socket.send('#0'), 20000)

            socket.on('message', (message: TSocketMessage): void | boolean => {
                if (message === '#1') return
                if (message === serverConfigs.key) {
                    authenticated = true
                    authorizeSocket(socket)
                    return clearTimeout(timeout)
                }
                if (authenticated) {
                    broadcast(socket.id, message)
                    serverConfigs.machineScale ? externalBroker.send(message) : ''
                }
            })

            socket.on('close', () => {
                clearTimeout(timeout)
                clearInterval(interval)
                if (authenticated)
                    for (let i: number = 0, len: number = sockets.length; i < len; i++)
                        if (sockets[i].id === socket.id) return sockets.splice(i, 1)
            })
        })

        brokerServer.on('error', (err: Error): void => logError('Broker ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n'))

        connectToExternalBroker()

        function broadcast(id: string, message: TSocketMessage): void {
            for (let i: number = 0, len: number = sockets.length; i < len; i++)
                if (sockets[i].id !== id) sockets[i].send(message)
        }

        function authorizeSocket(socket: IObject): void | number {
            socket.id = randomString(false)
            if (sockets.length) return sockets.push(socket)
            for (let i: number = 0, len: number = sockets.length; i < len; i++)
                if (sockets[i].id === socket.id) return authorizeSocket(socket)
            sockets.push(socket)
        }

        function connectToExternalBroker(): void {
            if (serverConfigs.machineScale) {
                const url: string = serverConfigs.machineScale.master ? '127.0.0.1:' : serverConfigs.machineScale.url + ':'
                Broker.Client('ws://' + url + serverConfigs.machineScale.port, serverConfigs.machineScale.securityKey || '', {
                    broadcastMessage: broadcast,
                    setBroker: (broker: WebSocket): IObject => externalBroker = broker
                })
            }
        }
    }
}