import * as WebSocket from 'uws';

import { MessageFactory } from '../messages/messages';
import { Worker } from '../worker';
import { EventEmitter } from '../eventEmitter/eventEmitter';

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

        this._runPing();
        this._connectPublishEvent();
        this._listenOnMessages();
        this._listenOnError();
        this._listenOnClose();
    }

    on(event: string, fn: any) {
        this.eventsEmitter.on(event, fn);
    }

    /**
     * Sends data the client trough
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
     *
     * Close uws socket
     */
    disconnect(code?: number, message?: any) {
        return this._socket.close(code, message);
    }

    /**
     * Sends configuration to the client library
     * and run ping interval.
     *
     * In case if got more then 2 missed pings in row
     * it will disconnect socket.
     */
    _runPing() {
        this.send('config', { pingInterval: this.server.options.pingInterval }, 'internal');

        this.pingPongInterval = setInterval(() => {
            if (this.missedPing >= 2) {
                return this.disconnect(3001, 'Did not get pong');
            }
            this.send('_0', null, 'ping');
            this.missedPing++;
        }, this.server.options.pingInterval);
    }

    /**
     *
     * Start to listen on publish event from
     * worker
     *
     */
    _connectPublishEvent() {
        this.publishListener = (msg: any) => {
            this.channelsEmitter.emit(msg.channel, msg.data);
        };
        this.server.on('publish', this.publishListener);
    }

    /**
     *
     * Listen on socket messages from uws socket
     * and redirect them to the user.
     *
     * Check if ping pog _1
     * if not then try to parse json object
     * and select right action
     */
    _listenOnMessages() {
        this._socket.on('message', (msg: any) => {
            if (msg === '_1') {
                return this.missedPing = 0;
            }

            try {
                msg = JSON.parse(msg);
            } catch (e) {
                return this.disconnect(1007);
            }

            switch (msg.action) {
                case 'emit':
                    this.eventsEmitter.emit(msg.event, msg.data);
                    break;
                case 'publish':
                    if (this.channelsEmitter.exist(msg.channel)) this.server.webSocketServer.publish(msg.channel, msg.data);
                    break;
                case 'internal':
                    if (msg.event === 'subscribe') {
                        this.channelsEmitter.on(msg.data, (data: any) => {
                            this.send(msg.data, data, 'publish');
                        });
                    }
                    if (msg.event === 'unsubscribe') {
                        this.channelsEmitter.removeEvent(msg.data);
                    }
                    break;
                default:
                    break;
            }
        });
    }

    /**
     *
     * Listen on socket error from uws socket
     * and redirect it to the user.
     */
    _listenOnError() {
        this._socket.on('error', (err?: any) => {
            this.eventsEmitter.emit('error', err);
        });
    }

    /**
     *
     * Listen on socket close from uws socket
     * and redirect it to the user.
     *
     * Also destroy socket and all events.
     */
    _listenOnClose() {
        this._socket.on('close', (code?: number, msg?: any) => {
            this.eventsEmitter.emit('disconnect', code, msg);

            clearInterval(this.pingPongInterval);
            this.server.removeListener('publish', this.publishListener);

            this.eventsEmitter.removeAllEvents();
            this.channelsEmitter.removeAllEvents();

            for (let key in this) {
                if (this.hasOwnProperty(key)) {
                    this[key] = null;
                    delete this[key];
                }
            }
        });
    }
}