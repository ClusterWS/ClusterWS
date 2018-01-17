import * as WebSocket from 'uws'

import { EventEmitter } from '../../emitter/emitter'
import { CustomObject, Listener } from '../../../utils/utils'

export class WSServer extends EventEmitter {
    public middleware: CustomObject = {}
    private broker: WebSocket

    public sendToWorkers(data: any): void {
        this.broker.send(Buffer.from(JSON.stringify({ channel: 'sendToWorkers', data })))
        this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(data)
    }

    public publish(channel: string, data: any): void {
        this.broker.send(Buffer.from(JSON.stringify({ channel, data })))
        if (this.middleware.onpublish)
            this.middleware.onpublish(channel, data)
        this.emitmany('#publish', { channel, data })
    }

    public setMiddleware(name: string, listener: Listener): void {
        this.middleware[name] = listener
    }

    public broadcastMessage(x: string, message: any): void {
        const decodedMessage: any = JSON.parse(Buffer.from(message).toString())
        if (decodedMessage.channel === 'sendToWorkers')
            return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(decodedMessage.data)

        if (this.middleware.onpublish)
            this.middleware.onpublish(decodedMessage.channel, decodedMessage.data)
        this.emitmany('#publish', decodedMessage)
    }

    public setBroker(br: WebSocket): void {
        this.broker = br
    }
}