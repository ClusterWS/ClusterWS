import * as WebSocket from 'uws'

import { Socket } from './socket'
import { logWarning } from '../../../utils/functions'
import { EventEmitterMany } from '../../emitter/emitter.many'
import { EventEmitterSingle } from '../../emitter/emitter.single'
import { CustomObject, Message, Listener, BrokersObject } from '../../../utils/interfaces'

export class WSServer extends EventEmitterSingle {
    public channels: EventEmitterMany = new EventEmitterMany()
    public middleware: CustomObject = {}
    private internalBrokers: BrokersObject = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    }

    public setMiddleware(name: 'onPublish', listener: (channel: string, message: Message) => void): void
    public setMiddleware(name: 'onSubscribe', listener: (socket: Socket, channel: string, next: Listener) => void): void
    public setMiddleware(name: 'verifyConnection', listener: (info: CustomObject, next: Listener) => void): void
    public setMiddleware(name: 'onMessageFromWorker', listener: (message: Message) => void): void
    public setMiddleware(name: string, listener: Listener): void {
        this.middleware[name] = listener
    }

    public publishToWorkers(message: Message): void
    public publishToWorkers(message: Message): void | NodeJS.Timer {
        this.publish('#sendToWorkers', message)
    }

    public publish(channel: string, message: Message, tryiesOnBrokerError?: number): void
    public publish(channel: string, message: Message, tryiesOnBrokerError: number = 0): void | NodeJS.Timer {
        if (tryiesOnBrokerError > this.internalBrokers.brokersAmount * 2 && tryiesOnBrokerError > 10) return logWarning('Faild to publish message')
        if (this.internalBrokers.brokersAmount === 0) return setTimeout(() => this.publish(channel, message, tryiesOnBrokerError++), 20)
        this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1 ?
            this.internalBrokers.nextBroker = 0 : this.internalBrokers.nextBroker++
        if (this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]].readyState !== 1)
            return this.publish(channel, message, tryiesOnBrokerError++)
        this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]]
            .send(Buffer.from(channel + '%' + JSON.stringify({ message })))

        if (channel === '#sendToWorkers')
            return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, message)

        this.middleware.onPublish && this.middleware.onPublish.call(null, channel, message)
        this.channels.emitMany(channel, message)
    }

    public broadcastMessage(x: string, message: Message): void {
        message = Buffer.from(message)
        const devider: number = message.indexOf(37)
        const channel: string = message.slice(0, devider).toString()
        if (channel === '#sendToWorkers')
            return this.middleware.onMessageFromWorker &&
                this.middleware.onMessageFromWorker.call(null, JSON.parse(message.slice(devider + 1)).message)
        if (!this.channels.exist(channel)) return

        const decodedMessage: any = JSON.parse(message.slice(devider + 1)).message
        this.middleware.onPublish && this.middleware.onPublish.call(null, channel, decodedMessage)
        this.channels.emitMany(channel, decodedMessage)
    }

    public setBroker(br: WebSocket, url: string): void {
        this.internalBrokers.brokers[url] = br
        this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers)
        this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length
    }
}