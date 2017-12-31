import * as WebSocket from 'uws'
import { Worker } from '../worker'
import { EventEmitter } from '../../utils/emitter'
import { TSocketMessage, TListener, logError, IObject } from '../../utils/utils'

export class Socket {
    private static decode(socket: Socket, message: TSocketMessage): null | void | string[] {
        switch (message['#'][0]) {
            case 'e': return socket.events.emit(message['#'][1], message['#'][2])
            case 'p': return socket.channels.indexOf(message['#'][1]) !== -1 ?
                socket.server.socketServer.publish(message['#'][1], message['#'][2]) : null
            case 's':
                switch (message['#'][1]) {
                    case 's':
                        const subscribe: any = (): number | null => socket.channels.indexOf(message['#'][2]) === -1 ?
                            socket.channels.push(message['#'][2]) : null
                        if (!socket.server.socketServer.middleware.onsubscribe) return subscribe()
                        return socket.server.socketServer.middleware.onsubscribe(
                            socket,
                            message['#'][2], (decline: boolean): void | null => decline ? subscribe() : null)
                    case 'u':
                        const index: number = socket.channels.indexOf(message['#'][2])
                        return index !== -1 ? socket.channels.splice(index, 1) : null
                    default: break
                }
            default: break
        }
    }

    private static encode(event: string, data: any, type: string): any {
        switch (type) {
            case 'ping': return event
            case 'emit': return JSON.stringify({ '#': ['e', event, data] })
            case 'publish': return JSON.stringify({ '#': ['p', event, data] })
            case 'system':
                switch (event) {
                    case 'subsribe': return JSON.stringify({ '#': ['s', 's', data] })
                    case 'unsubscribe': return JSON.stringify({ '#': ['s', 'u', data] })
                    case 'configuration': return JSON.stringify({ '#': ['s', 'c', data] })
                    default: break
                }
            default: break
        }
    }

    public missedPing: number = 0
    public channels: string[] = []
    public events: EventEmitter = new EventEmitter()

    constructor(public socket: WebSocket, private server: Worker) {
        const onPublish: any = (message: TSocketMessage): void | null =>
            this.channels.indexOf(message.channel) !== -1 ? this.send(message.channel, message.data, 'publish') : null

        const pingInterval: NodeJS.Timer = setInterval((): void =>
            this.missedPing++ > 2 ? this.disconnect(4001, 'No pongs') : this.send('#0', null, 'ping'),
            this.server.options.pingInterval)

        this.server.socketServer.on('#publish', onPublish)
        this.send('configuration', { ping: this.server.options.pingInterval, binary: this.server.options.useBinary }, 'system')

        this.socket.on('error', (err: Error): void => this.events.emit('error', err))
        this.socket.on('close', (code: number, reason: any): void => {
            clearInterval(pingInterval)
            this.events.emit('disconnect', code, reason)
            this.server.socketServer.removeListener('#publish', onPublish)
            for (const key in this) this[key] ? this[key] = null : null
        })
        this.socket.on('message', (message: TSocketMessage): void | number => {
            if (this.server.options.useBinary && typeof message !== 'string') message = Buffer.from(message).toString()
            if (message === '#1') return this.missedPing = 0
            try {
                message = JSON.parse(message)
            } catch (e) { return logError('PID: ' + process.pid + '\n' + e + '\n') }

            Socket.decode(this, message)
        })
    }

    public send(event: string, data: any, type: string = 'emit'): void {
        this.socket.send(this.server.options.useBinary ?
            Buffer.from(Socket.encode(event, data, type)) : Socket.encode(event, data, type))
    }

    public on(event: string, listener: TListener): void {
        this.events.on(event, listener)
    }

    public disconnect(code?: number, reason?: string): void {
        this.socket.close(code, reason)
    }
}