import * as WebSocket from 'uws';
import {MessageFactory} from '../../messages/messages';
import {Worker} from '../worker';

export class Socket {
    events: any;
    channels: any;
    publishListener: any;

    constructor(public _socket: WebSocket, public server: Worker) {
        this.events = {};
        this.channels = {};

        console.log(this.server.id);

        this.channels['food'] = (data: any) => {
            this.send('food', data, 'publish');
        };

        this.publishListener = (msg: any) => {
            let exFn = this.channels[msg.channel];
            if (exFn) exFn(msg.data);
        };

        server.on('publish', this.publishListener);

        _socket.on('message', (msg: any) => {
            msg = JSON.parse(msg);
            if (msg.action === 'emit') {
                let fn: any = this.events[msg.event];
                if (fn) fn(msg.data);
            }

            // Pub Sub functions
            if (msg.action === 'publish') {
                if (this.channels[msg.channel]) server.webSocketServer.publish(msg.channel, msg.data);
            }
            if (msg.action === 'subscribe') {
                this.channels[msg.channel] = (data: any) => {
                    this.send(msg.channel, data, 'publish');
                }
            }
            if (msg.action === 'unsubscribe') {
                if (this.channels[msg.channel]) {
                    this.channels[msg.channel] = null;
                    delete this.channels[msg.channel];
                }
            }
        });


        _socket.on('close', (code?: number, message?: any) => {
            let fn: any = this.events['close'];
            if (fn) fn(code, message);

            this.server.unsubscribe('publish', this.publishListener);

            for (let key in this.channels) {
                if (this.channels.hasOwnProperty(key)) {
                    this.channels[key] = null;
                    delete this.channels[key];
                }
            }

            for (let key in this.events) {
                if (this.events.hasOwnProperty(key)) {
                    this.events[key] = null;
                    delete this.events[key];
                }
            }

            for (let key in this) {
                if (this.hasOwnProperty(key)) {
                    this[key] = null;
                    delete this[key];
                }
            }

        });

        _socket.on('error', (err?: any) => {
            let fn: any = this.events['error'];
            if (fn) fn(err);
        });
    }

    on(event: string, fn: any) {
        if (this.events[event]) this.events[event] = null;
        this.events[event] = fn;
    }

    send(event: string, data?: any, type?: string) {
        if (type === 'publish') return this._socket.send(MessageFactory.publishMessage(event, data));
        return this._socket.send(MessageFactory.emitMessage(event, data));
    }
}