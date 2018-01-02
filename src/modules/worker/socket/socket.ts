import * as WebSocket from 'uws'

import { Worker } from '../worker'
import { Listener, CustomObject, logError } from '../../../utils/utils'
import { EventEmitter } from '../../emitter/emitter'

export class Socket {
    private missedPing: number = 0
    private channels: CustomObject = {}
    private events: EventEmitter = new EventEmitter()

    constructor(private worker: Worker, private socket: WebSocket) {
        const onPublish: any = (message: any): void =>
            this.channels[message.channel] && this.send(message.channel, message.data, 'publish')
        const pingInterval: NodeJS.Timer = setInterval((): void => this.missedPing++ > 2 ?
            this.disconnect(4001, 'No pongs') : this.send('#0', null, 'ping'), this.worker.options.pingInterval)

        this.worker.wss.onmany('#publish', onPublish)
        this.send('configuration', { ping: this.worker.options.pingInterval, binary: this.worker.options.useBinary }, 'system')

        this.socket.on('error', (err: Error): void => this.events.emit('error', err))
        this.socket.on('close', (code: number, reason: any): void => {
            clearInterval(pingInterval)
            this.events.emit('disconnect', code, reason)
            this.worker.wss.removeListener('#publish', onPublish)
            for (const key in this) this[key] ? this[key] = null : null
        })
        this.socket.on('message', (message: any): number => {
            this.worker.options.useBinary && typeof message !== 'string' ?
                message = Buffer.from(message).toString() : null

            if (message === '#1') return this.missedPing = 0
            try {
                message = JSON.parse(message)
            } catch (e) { return logError('PID: ' + process.pid + '\n' + e + '\n') }

            Socket.decode(this, message)
        })
    }

    public on(event: string, listener: Listener): void {
        this.events.on(event, listener)
    }

    public send(event: string, data: any, type: string = 'emit'): void {
        this.socket.send(this.worker.options.useBinary ? Buffer.from(Socket.encode(event, data, type)) : Socket.encode(event, data, type))
    }

    public disconnect(code?: number, reason?: string): void {
        this.socket.close(code, reason)
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

    private static decode(socket: Socket, message: any): any {
        switch (message['#'][0]) {
            case 'e': return socket.events.emit(message['#'][1], message['#'][2])
            case 'p': return socket.channels[message['#'][1]] && socket.worker.wss.publish(message['#'][1], message['#'][2])
            case 's':
                switch (message['#'][1]) {
                    case 's':
                        const subscribe: any = (): number => socket.channels[message['#'][2]] = 1
                        return !socket.worker.wss.middleware.onsubscribe ? subscribe() :
                            socket.worker.wss.middleware.onsubscribe(socket, message['#'][2], (allow: boolean): void => allow && subscribe())
                    case 'u': return socket.channels[message['#'][2]] = null
                    default: break
                }
            default: break
        }
    }
}