import { _ } from '../../../utils/fp'
import { Options } from '../../../options'
import { EventEmitter } from '../../../utils/eventemitter'
import { socketMessages } from '../../../communication/messages'


export class Socket {
    events: EventEmitter = new EventEmitter()
    channels: EventEmitter = new EventEmitter()

    constructor(public socket: any, pubsub: any, options: Options) {

        // let publishListener = (msg: any) => this.channels.emit(msg)
        // listen('#publish', publishListener)

        let missedPing: number = 0
        let pingInterval = setInterval(() => (missedPing++) > 2 ? this.disconnect(3001, 'No pongs from socket') : this.send('#0', null, 'ping'), options.pingInterval)

        this.socket.on('message', (msg: any) => {
            msg === '#1' ? missedPing = 0 : msg = JSON.parse(msg)

            _.switchcase({
                'p': () => pubsub.emit(msg.m[1], msg.m[2]),
                'e': () => this.events.emit(msg.m[1], msg.m[2]),
                's': () => _.switchcase({
                    'subscribe': () => this.channels.on(msg.m[2], (data: any) => this.send(msg.m[2], data, 'pub')),
                    'unsubscribe': () => this.channels.removeEvent(msg.m[2])
                })(msg.m[1])
            })(msg.m[0])
        })

        this.socket.on('close', (code: number, msg: any) => {
            this.events.emit('disconnect', code, msg)

            clearInterval(pingInterval)
            for (let key in this) if (this.hasOwnProperty(key)) this[key] = null
        })

        this.socket.on('error', (err: any) => this.events.emit('error', err))
    }

    on(event: string, fn: any) {
        this.socket.on(event, fn)
    }

    send(event: string, data: any, type?: string) {
        this.socket.send(socketMessages(event, data, type || 'emt'))
    }

    disconnect(code?: number, msg?: any) {
        this.socket.close(code, msg)
    }
}





export class Socket2 {
    missedPing: number = 0;
    eventsEmitter: EventEmitter;
    channelsEmitter: EventEmitter;
    publishListener: any;
    pingPongInterval: any;


    constructor(public _socket: WebSocket, public server: Worker) {
        this.eventsEmitter = new EventEmitter();
        this.channelsEmitter = new EventEmitter();

        this.publishListener = (msg: any) => {
            this.channelsEmitter.emit(msg.channel, msg.data);
        };
        this.server.on('publish', this.publishListener);

        socketPing(this);
        socketMessage(this);
        socketError(this);
        socketClose(this);
    }

    on(event: string, fn: any) {
        if (!this.eventsEmitter.exist(event)) this.eventsEmitter.on(event, fn);
    }

    /**
     * Sends data to the client trough
     * uws socket.
     */
    send(event: string, data?: any, type?: string) {
        switch (type) {
            case 'ping':
                this._socket.send(event);
                break;
            case 'internal':
                this._socket.send(MessageFactory.internalMessage(event, data));
                break;
            case 'publish':
                this._socket.send(MessageFactory.publishMessage(event, data));
                break;
            default:
                this._socket.send(MessageFactory.emitMessage(event, data));
                break;
        }
    }

    /**
     * Mehtod to close uws
     */
    disconnect(code?: number, message?: any) {
        return this._socket.close(code, message);
    }
}