import * as WebSocket from 'uws'

import { Worker } from '../worker'
import { EventEmitter } from '../../emitter/emitter'
import { decode, encode } from './parser/parser'
import { Listener, CustomObject, logError } from '../../../utils/utils'

export class Socket {
    public channels: CustomObject = {}
    public events: EventEmitter = new EventEmitter()

    private missedPing: number = 0

    constructor(public worker: Worker, private socket: WebSocket) {
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

            decode(this, message)
        })
    }

    public on(event: string, listener: Listener): void {
        this.events.on(event, listener)
    }

    public send(event: string, data: any, type: string = 'emit'): void {
        this.socket.send(this.worker.options.useBinary ? Buffer.from(encode(event, data, type)) : encode(event, data, type))
    }

    public disconnect(code?: number, reason?: string): void {
        this.socket.close(code, reason)
    }
}