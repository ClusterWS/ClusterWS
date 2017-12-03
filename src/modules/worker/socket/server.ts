import * as WebSocket from 'uws'
import { EventEmitter } from '../../utils/emitter'
import { TListener, IObject, TSocketMessage } from '../../utils/utils'

export class SocketServer extends EventEmitter {
    public middleware: IObject = {}
    private brokerSocket: WebSocket

    public setMiddleware(name: string, listener: TListener): void {
        this.middleware[name] = listener
    }

    public publish(channel: string, data: any): void {
        this.brokerSocket.send(Buffer.from(JSON.stringify({ channel, data })))
        this.emit('#publish', { channel, data })
    }

    public setBroker(broker: WebSocket): void {
        this.brokerSocket = broker
    }

    public broadcastMessage(x: string, message: TSocketMessage): void {
        this.emit('#publish', JSON.parse(Buffer.from(message).toString()))
    }
}