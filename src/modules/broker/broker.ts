import * as WebSocket from 'uws'
import { logError, logWarning } from '../utils/logs'
import { IOptions, IProcessMessage } from '../utils/interfaces'
import { SocketServer } from '../worker/socket/socketServer'

declare let process: any

export class Broker {
    public static Client(url: string, key: string, broadcaster: SocketServer | any): void {
        const websocket: WebSocket = new WebSocket(url)
        const isSocket: boolean = broadcaster instanceof SocketServer

        websocket.on('open', (): void => websocket.send(key))
        websocket.on('error', (err: any) => logError('Socket ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n'))
        websocket.on('message', (message: any): void => {
            if (message === '#0') return websocket.send('#1')
            isSocket ? broadcaster.emit('#publish', JSON.parse(Buffer.from(message).toString())) : broadcaster.send('', message)
        })
        websocket.on('close', (code: number, reason: string): void => {
            if (code === 4000) return logError('Socket had been disconnected with error 4000 please contact developers to fix this bug')
            logWarning('Something went wrong, socket will be reconnected')
            Broker.Client(url, key, broadcaster)
        })
        broadcaster.setBroker(websocket)
    }

    public static Server(port: number, info: any): void {
        let socketBroker: WebSocket
        const sockets: any[] = []
        const server: WebSocket.Server = new WebSocket.Server({ port }, (): void => process.send({ event: 'Ready', data: process.pid }))

        server.on('connection', (socket: any) => {
            let authenticated: boolean = false
            const timeout: any = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)
            const interval: any = setInterval((): void => socket.send('#0'), 20000)

            socket.on('message', (message: any) => {
                if (message === '#1') return
                if (message === info.key) {
                    authenticated = true
                    setUniqueId(socket)
                    return clearTimeout(timeout)
                }
                if (authenticated) {
                    broadcast(socket.id, message)
                    if (info.machineScale) socketBroker.send(message)
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

        if (info.machineScale) {
            const url: string = info.machineScale.master ? '127.0.0.1:' : info.machineScale.url + ':'
            Broker.Client('ws://' + url + info.machineScale.port, info.machineScale.externalKey || '', {
                send: broadcast,
                setBroker: (broker: WebSocket): any => socketBroker = broker
            })
        }

        function broadcast(id: any, message: any): void {
            for (let i: number = 0, len: number = sockets.length; i < len; i++)
                if (sockets[i].id !== id) sockets[i].send(message)
        }

        function setUniqueId(socket: any): void | any {
            socket.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            if (sockets.length === 0) return sockets.push(socket)
            for (let i: number = 0, len: number = sockets.length; i < len; i++) {
                if (sockets[i].id === socket.id) return setUniqueId(socket)
                if (i === len - 1) return sockets.push(socket)
            }
        }
        server.on('error', (err: any) => logError('Broker ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n'))
    }
}