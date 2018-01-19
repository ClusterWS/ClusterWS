import * as WebSocket from 'uws'
import { HorizontalScaleOptions, Message, CustomObject, generateKey, logReady, logError, logWarning } from '../../utils/utils'

export function BrokerServer(port: number, key: string, horizontalScaleOptions: HorizontalScaleOptions | false): void {
    const sockets: CustomObject[] = []
    const server: WebSocket.Server = new WebSocket.Server({ port }, (): void => process.send({ event: 'READY', pid: process.pid }))

    server.on('connection', (socket: any) => {
        let authenticated: boolean = false

        const interval: NodeJS.Timer = setInterval((): void => socket.send('#0'), 20000)
        const timeout: NodeJS.Timer = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)

        socket.on('message', (message: Message): void => {
            if (message === '#1') return
            if (message === key) {
                if (authenticated) return
                authenticated = true
                authenticateSocket(socket)
                return clearTimeout(timeout)
            }
            if (authenticated) broadcast(socket.id, message)
        })

        socket.on('close', (code: number, reason: string) => {
            clearTimeout(timeout)
            clearInterval(interval)
            if (authenticated)
                for (let i: number = 0, len: number = sockets.length; i < len; i++)
                    if (sockets[i].id === socket.id) return sockets.splice(i, 1)
            socket = null
        })
    })

    function broadcast(id: string, message: Message): void {
        for (let i: number = 0, len: number = sockets.length; i < len; i++)
            if (sockets[i].id !== id) sockets[i].send(message)
    }

    function authenticateSocket(socket: CustomObject): void {
        socket.id = generateKey(16)
        for (let i: number = 0, length: number = sockets.length; i < length; i++)
            if (sockets[i].id === socket.id) return authenticateSocket(socket)
        sockets.push(socket)
    }
}

export function BrokerClient(url: string, key: string, broadcaster: any, reconnected?: boolean): void {
    let websocket: WebSocket = new WebSocket(url)
    websocket.on('open', () => {
        broadcaster.setBroker(websocket, url)
        if (reconnected) logReady('Broker\'s socket has been reconnected')
        websocket.send(key)
    })
    websocket.on('error', (err: Error): void | NodeJS.Timer => {
        if (err.stack === 'uWs client connection error') {
            websocket = null
            return setTimeout(() => BrokerClient(url, key, broadcaster, true), 20)
        }
        logError('Socket ' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n')
    })
    websocket.on('close', (code: number, reason: string): void | NodeJS.Timer => {
        if (code === 4000) return logError('Wrong authorization key')
        logWarning('Something went wrong, socket will be reconnected as soon as possible')
        websocket = null
        return setTimeout(() => BrokerClient(url, key, broadcaster, true), 20)
    })

    websocket.on('message', (message: Message): void => message === '#0' ? websocket.send('#1') : broadcaster.broadcastMessage('', message))
}