import * as WebSocket from 'uws'

import { Worker } from '../worker'
import { EventEmitterSingle } from '../../emitter/emitter.single'
import { CustomObject, Listener, Message } from '../../../utils/interfaces'

export class Socket {
    public events: EventEmitterSingle = new EventEmitterSingle()
    public channels: CustomObject = {}
    public onPublish: any

    private missedPing: number = 0

    constructor(public worker: Worker, private socket: WebSocket) {

    }

    public on(event: 'error', listener: (err: Error) => void): void
    public on(event: 'disconnect', listener: (code?: number, reason?: string) => void): void
    public on(event: string, listener: Listener): void
    public on(event: string, listener: Listener): void {
        this.events.on(event, listener)
    }

    public send(event: string, message: Message, type?: string): void
    public send(event: string, message: Message, type: string = 'emit'): void {
        // this.socket.send(this.worker.options.useBinary ?
        //     Buffer.from(encode(event, message, type)) :
        //     encode(event, message, type))
    }
    public disconnect(code?: number, reason?: string): void {
        this.socket.close(code, reason)
    }
}