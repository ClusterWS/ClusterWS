import * as WebSocket from 'uws'

import { EventEmitter } from '../../emitter/emitter'
import { CustomObject, Listener } from '../../../utils/utils'

export class WSServer extends EventEmitter {
    public middleware: CustomObject = {}
    private broker: WebSocket

    public publish(channel: string, data: any): void {
        this.broker.send(Buffer.from(JSON.stringify({ channel, data })))
        this.emitmany('#publish', { channel, data })
    }

    public setMiddleware(name: string, listener: Listener): void {
        this.middleware[name] = listener
    }

    public broadcastMessage(x: string, message: any): void {
        this.emitmany('#publish', JSON.parse(Buffer.from(message).toString()))
    }

    public setBroker(br: WebSocket): void {
        this.broker = br
    }
}