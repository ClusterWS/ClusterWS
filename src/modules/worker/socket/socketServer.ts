import * as WebSocket from 'uws'
import { EventEmitter } from '../../common/emitter'

export class SocketServer extends EventEmitter {
    public middleware: any = {}
    private brokerSocket: WebSocket

    constructor() { super() }

    public publish(channel: string, data: any): void {
        this.brokerSocket.send(Buffer.from(JSON.stringify({ channel, data })))
        this.emit('#publish', { channel, data })
    }

    public setBroker(brokerSocket: WebSocket): void {
        this.brokerSocket = brokerSocket
    }
}