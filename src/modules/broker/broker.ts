import * as WebSocket from 'uws'
import { logError, logWarning } from '../utils/logs'
import { IOptions, IProcessMessage } from '../utils/interfaces'
import { SocketServer } from '../worker/socket/socketServer'

declare let process: any

export class Broker {
    public static Client(url: string, key: string, socketServer: SocketServer): void {
        const websocket: WebSocket = new WebSocket(url)

        websocket.on('open', (): void => websocket.send(key))
        websocket.on('message', (message: any): void => message === '#0' ? websocket.send('#1') : socketServer.emit('#publish', JSON.parse(message.toString())))
        websocket.on('error', (err: any) => logError('Socket ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n'))
        websocket.on('close', (code: number, reason: string): void => {
            if (code === 4000) return logError('Socket had been disconnected please contact developers to fix this bug')
            logWarning('Something went wrong, socket will be reconnected')
            Broker.Client(url, key, socketServer)
        })
        socketServer.setBroker(websocket)
    }

    public static Server(options: IOptions, info: any): void {
        const sockets: any[] = []
        const server: WebSocket.Server = new WebSocket.Server({ port: options.brokerPort }, (): void => process.send({ event: 'Ready', data: process.pid }))

        server.on('connection', (socket: any) => {
            let authenticated: boolean = false
            const timeout: any = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)
            const interval: any = setInterval((): void => socket.send('#0'), 20000)

            socket.on('message', (message: any) => {
                if (message === '#1') return
                if (message === info.internalKey) {
                    authenticated = true
                    setUniqueId(socket)
                    return clearTimeout(timeout)
                }
                if (authenticated)
                    for (let i: number = 0, len: number = sockets.length; i < len; i++)
                        if (sockets[i].id !== socket.id) sockets[i].send(message)
            })

            socket.on('close', () => {
                clearTimeout(timeout)
                clearInterval(interval)
                if (authenticated)
                    for (let i: number = 0, len: number = sockets.length; i < len; i++)
                        if (sockets[i].id === socket.id) return sockets.splice(i, 1)
            })
        })

        server.on('error', (err: any) => logError('Broker ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n'))

        function setUniqueId(socket: any): void | any {
            socket.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
            if (sockets.length === 0) return sockets.push(socket)
            for (let i: number = 0, len: number = sockets.length; i < len; i++) {
                if (sockets[i].id === socket.id) return setUniqueId(socket)
                if (i === len - 1) return sockets.push(socket)
            }
        }
    }
}