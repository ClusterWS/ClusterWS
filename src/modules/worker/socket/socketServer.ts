import * as WebSocket from 'uws'
import { EventEmitter } from '../../utils/emitter'

export class SocketServer extends EventEmitter {
    public middleware: any = {}
    private socketBroker: WebSocket

    constructor() {
        super()
    }

    public publish(channel: string, data: any): void {
        this.socketBroker.send(Buffer.from(JSON.stringify({ channel, data })))
        this.emit('#publish', { channel, data })
    }

    public setBroker(socketBroker: WebSocket): void {
        this.socketBroker = socketBroker
    }
}