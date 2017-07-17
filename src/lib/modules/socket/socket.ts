import * as WebSocket from 'uws';

import { Worker } from '../worker';
import { EventEmitter } from '../eventEmitter/eventEmitter';
import { MessageFactory } from '../messages/messages';

import { socketPing } from './modules/socketPing';
import { socketMessage } from './modules/socketMessage';
import { socketClose } from './modules/socketClose';
import { socketError } from './modules/socketError';

/**
 *
 * Responsible for binding uws socket with new custom socket
 * save events and channels, send messages to the client,
 * destroy data on close and so on.
 *
 */
export class Socket {
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