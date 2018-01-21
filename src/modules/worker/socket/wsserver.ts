import * as WebSocket from 'uws'

import { Socket } from './socket'
import { EventEmitter } from '../emitter/emitter'
import { EventEmitterMany } from '../emitter/emittermany'
import { CustomObject, Listener, Message, logWarning, logError } from '../../../utils/utils'

export class WSServer extends EventEmitter {
    public channels: EventEmitterMany = new EventEmitterMany()
    public middleware: CustomObject = {}

    private brokers: CustomObject = {}
    private nextBroker: number = 0
    private brokersKeys: string[] = []
    private brokersKeysLength: number = 0

    public setMiddleware(name: 'onPublish', listener: (channel: string, message: Message) => void): void
    public setMiddleware(name: 'onSubscribe', listener: (socket: Socket, channel: string, next: Listener) => void): void
    public setMiddleware(name: 'verifyConnection', listener: (info: CustomObject, next: Listener) => void): void
    public setMiddleware(name: 'onMessageFromWorker', listener: (message: Message) => void): void
    public setMiddleware(name: string, listener: Listener): void {
        this.middleware[name] = listener
    }

    public sendToWorkers(message: Message, tryiesOnBrokerError: number = 0): void | NodeJS.Timer {
        if (this.brokersKeysLength === 0) return setTimeout(() => this.sendToWorkers(message), 20)
        try { this.brokers[this.brokersKeys[this.nextBroker]].send(Buffer.from('sendToWorkers%' + JSON.stringify({ message }))) } catch (err) {
            if (tryiesOnBrokerError > this.brokersKeysLength) return logError('Does not have access to any Broker')
            logWarning('Could not pass message to the internal Broker \n' + err.stack)
            this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++
            tryiesOnBrokerError++
            return this.sendToWorkers(message, tryiesOnBrokerError)
        }
        this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker.call(null, message)
        this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++
    }

    public publish(channel: string, message: Message, tryiesOnBrokerError: number = 0): void | NodeJS.Timer {
        if (channel === 'sendToWorkers') return
        if (this.brokersKeysLength === 0) return setTimeout(() => this.publish(channel, message), 20)
        try { this.brokers[this.brokersKeys[this.nextBroker]].send(Buffer.from(channel + '%' + JSON.stringify({ message }))) } catch (err) {
            if (tryiesOnBrokerError > this.brokersKeysLength) return logError('Does not have access to any Broker')
            logWarning('Could not pass message to the internal Broker \n' + err.stack)
            this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++
            tryiesOnBrokerError++
            return this.publish(channel, message, tryiesOnBrokerError)
        }
        this.middleware.onPublish && this.middleware.onPublish.call(null, channel, message)
        this.channels.emitmany(channel, message)
        this.nextBroker >= this.brokersKeysLength - 1 ? this.nextBroker = 0 : this.nextBroker++
    }

    public broadcastMessage(x: string, message: Message): void {
        message = Buffer.from(message)
        const devider: number = message.indexOf(37)
        const channel: string = message.slice(0, devider).toString()
        if (channel === 'sendToWorkers')
            return this.middleware.onMessageFromWorker &&
                this.middleware.onMessageFromWorker.call(null, JSON.parse(message.slice(devider + 1)).message)
        if (this.channels.exist(channel)) {
            const decodedMessage: any = JSON.parse(message.slice(devider + 1)).message
            this.middleware.onPublish && this.middleware.onPublish.call(null, channel, decodedMessage)
            return this.channels.emitmany(channel, decodedMessage)
        }
    }

    public setBroker(br: WebSocket, url: string): void {
        this.brokers[url] = br
        this.brokersKeys = Object.keys(this.brokers)
        this.brokersKeysLength = this.brokersKeys.length
    }
}