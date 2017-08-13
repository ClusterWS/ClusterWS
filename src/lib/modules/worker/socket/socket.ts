import { EventEmitter } from '../../../utils/eventemitter'


export class Socket {
    on: any
    send: any
    events: EventEmitter = new EventEmitter()
    channels: EventEmitter = new EventEmitter()
    
    constructor(socket: any, listen: any) {
        this.on = this.events.on
        this.send = socket.send

        let publishListener = (msg: any) => this.channels.emit(msg)
        listen('#publish', publishListener)

        let missedPing: number = 0
        let pingInterval = () => socket.send('#0')
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