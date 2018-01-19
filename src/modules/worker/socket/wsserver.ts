import * as WebSocket from 'uws'
import { EventEmitter } from '../emitter'
import { CustomObject, Listener, Message } from '../../../utils/utils'

export class WSServer extends EventEmitter {
    public middleware: CustomObject = {}
    private brokers: CustomObject = {}

    // Add socket type
    public setMiddleware(name: 'onSubscribe', listener: (socket: any, channel: string, next: Listener) => void): void
    public setMiddleware(name: 'onMessageFromWorker', listener: (message: Message) => void): void
    public setMiddleware(name: 'verifyConnection', listener: (info: CustomObject, next: Listener) => void): void
    public setMiddleware(name: string, listener: Listener): void {
        this.middleware[name] = listener
    }

    public broadcastMessage(x: string, message: Message): void {

    }

    public setBroker(br: WebSocket, url: string): void {
        this.brokers[url] = br
    }
}