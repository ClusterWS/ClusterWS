import * as WebSocket from 'uws'

import { Socket } from './socket'
import { EventEmitter } from '../emitter/emitter'
import { EventEmitterMany } from '../emitter/emittermany'
import { CustomObject, Listener, Message } from '../../../utils/utils'

export class WSServer extends EventEmitter {
    public channels: EventEmitterMany = new EventEmitterMany()
    public middleware: CustomObject = {}

    private brokers: CustomObject = {}
    private nextBroker: number = 0

    public setMiddleware(name: 'onSubscribe', listener: (socket: Socket, channel: string, next: Listener) => void): void
    public setMiddleware(name: 'onMessageFromWorker', listener: (message: Message) => void): void
    public setMiddleware(name: 'verifyConnection', listener: (info: CustomObject, next: Listener) => void): void
    public setMiddleware(name: string, listener: Listener): void {
        this.middleware[name] = listener
    }

    public sendToWorkers(message: Message): void {
        const brokersKeys: string[] = Object.keys(this.brokers)
        this.brokers[brokersKeys[this.nextBroker]].send(Buffer.from('sendToWorkers%' + JSON.stringify({ message })))
        this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, message)
        this.nextBroker >= brokersKeys.length - 1 ? this.nextBroker = 0 : this.nextBroker++
    }

    public publish(channel: string, message: Message): void {
        if (channel === 'sendToWorkers') return
        const brokersKeys: string[] = Object.keys(this.brokers)
        this.brokers[brokersKeys[this.nextBroker]].send(Buffer.from(channel + '%' + JSON.stringify({ message })))
        this.channels.emitmany(channel, message)
        this.nextBroker >= brokersKeys.length - 1 ? this.nextBroker = 0 : this.nextBroker++
    }

    public broadcastMessage(x: string, message: Message): void {
        message = Buffer.from(message)
        const devider: number = message.indexOf(37)
        const channel: string = message.slice(0, devider).toString()
        if (channel === 'sendToWorkers')
            return this.middleware.onMessageFromWorker &&
                this.middleware.onMessageFromWorker.call(null, JSON.parse(message.slice(devider + 1).message))
        if (this.channels.exist(channel)) {
            const decodedMessage: any = JSON.parse(message.slice(devider + 1)).message
            return this.channels.emitmany(channel, decodedMessage)
        }
    }

    public setBroker(br: WebSocket, url: string): void {
        this.brokers[url] = br
    }
}