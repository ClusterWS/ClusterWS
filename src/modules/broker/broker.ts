import * as WebSocket from 'uws'
import { ScaleOptions, CustomObject, randomString, logReady, logError, logWarning } from '../../utils/utils'

declare const process: any

export class Broker {
    public static Client(url: string, key: string, broadcaster: any, reconnected?: boolean): void {
        const websocket: WebSocket = new WebSocket(url)
        websocket.on('open', () => {
            if (reconnected) logReady('Socket has been reconnected')
            websocket.send(key)
        })
        websocket.on('error', (err: Error): void => {
            if (err.stack === 'uWs client connection error') return Broker.Client(url, key, broadcaster, true)
            logError('Socket ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n')
        })
        websocket.on('close', (code: number, reason: string): void => {
            if (code === 4000) return logError('Wrong authorization key')
            logWarning('Something went wrong, socket will be reconnected as soon as possible')
            Broker.Client(url, key, broadcaster, true)
        })
        websocket.on('message', (message: any): void => message === '#0' ? websocket.send('#1') : broadcaster.broadcastMessage('', message))
        broadcaster.setBroker(websocket)
    }

    public static Server(serverPort: number, key: string, scaleOptions?: ScaleOptions | false): void {
        let broker: WebSocket

        const server: WebSocket.Server = new WebSocket.Server({ port: serverPort }, (): void => process.send({ event: 'READY', pid: process.pid }))
        const sockets: CustomObject[] = []

        server.on('connection', (socket: CustomObject) => {
            let authenticated: boolean = false

            const timeout: NodeJS.Timer = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)
            const interval: NodeJS.Timer = setInterval((): void => socket.send('#0'), 20000)

            socket.on('message', (message: any): void => {
                switch (message) {
                    case '#1': return
                    case key:
                        if (authenticated) return
                        authenticated = true
                        authenticateSocket(socket)
                        return clearTimeout(timeout)
                }

                if (authenticated) {
                    broadcast(socket.id, message)
                    broker && scaleOptions ? broker.send(message) : null
                }
            })

            socket.on('close', (): CustomObject => {
                clearTimeout(timeout)
                clearInterval(interval)
                if (authenticated)
                    for (let i: number = 0, len: number = sockets.length; i < len; i++)
                        if (sockets[i].id === socket.id) return sockets.splice(i, 1)
            })
        })

        connectToBroker()

        function broadcast(id: string, message: CustomObject): void {
            for (let i: number = 0, len: number = sockets.length; i < len; i++)
                if (sockets[i].id !== id) sockets[i].send(message)
        }

        function authenticateSocket(socket: CustomObject): void {
            socket.id = randomString(16)
            for (let i: number = 0, length: number = sockets.length; i < length; i++)
                if (sockets[i].id === socket.id) return authenticateSocket(socket)
            sockets.push(socket)
        }

        function connectToBroker(): void {
            scaleOptions &&
                Broker.Client('ws://' + (scaleOptions.master ? '127.0.0.1' : scaleOptions.url) + ':' + scaleOptions.port, scaleOptions.key || '', {
                    broadcastMessage: broadcast,
                    setBroker: (br: WebSocket): WebSocket => broker = br
                })
        }
    }
}