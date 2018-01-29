import * as WebSocket from 'uws'

import { Worker } from '../worker'
import { EventEmitter } from '../emitter/emitter'
import { encode, decode } from './parser'
import { Listener, Message, CustomObject, logError } from '../../../utils/utils'

export class Socket {
    public events: EventEmitter = new EventEmitter()
    public channels: CustomObject = {}
    public onPublish: any
    private missedPing: number = 0

    constructor(public worker: Worker, private socket: WebSocket) {
        this.onPublish = (channel: string, message: Message): void => this.send(channel, message, 'publish')
        const pingInterval: NodeJS.Timer = setInterval((): void => this.missedPing++ > 2 ?
            this.disconnect(4001, 'No pongs') : this.send('#0', null, 'ping'), this.worker.options.pingInterval)
        this.send('configuration', { ping: this.worker.options.pingInterval, binary: this.worker.options.useBinary }, 'system')
        this.socket.on('error', (err: Error): void => this.events.emit('error', err))

        this.socket.on('close', (code?: number, reason?: string): void => {
            clearInterval(pingInterval)
            this.events.emit('disconnect', code, reason)
            for (const key in this.channels) this.channels[key] && this.worker.wss.channels.removeListener(key, this.onPublish)
            for (const key in this) this[key] ? this[key] = null : null
        })

        this.socket.on('message', (message: Message): number => {
            typeof message !== 'string' ? message = Buffer.from(message).toString() : null
            if (message === '#1') return this.missedPing = 0
            try {
                message = JSON.parse(message)
            } catch (e) { return logError('PID: ' + process.pid + '\n' + e + '\n') }
            decode(this, message)
        })
    }

    public on(event: 'error', listener: (err: Error) => void): void
    public on(event: 'disconnect', listener: (code?: number, reason?: string) => void): void
    public on(event: string, listener: Listener): void
    public on(event: string, listener: Listener): void {
        this.events.on(event, listener)
    }

    public send(event: string, message: Message, type: string = 'emit'): void {
        this.socket.send(this.worker.options.useBinary ?
            Buffer.from(encode(event, message, type)) :
            encode(event, message, type))
    }

    public disconnect(code?: number, reason?: string): void {
        this.socket.close(code, reason)
    }
}