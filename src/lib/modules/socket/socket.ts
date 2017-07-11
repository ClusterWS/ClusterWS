import * as WebSocket from 'uws';
import {MessageFactory} from '../messages/messages';
import {Worker} from '../worker';

export class Socket {
    events: any;
    channels: any;
    publishListener: any;
    pingPongInterval: any;
    pingPong: number = 0;

    constructor(public _socket: WebSocket, public server: Worker) {
        this.events = {};
        this.channels = {};

        // Send configuration to the client
        this.send('config',{ping: this.server.options.pingPongInterval} , 'internal');

        // Interval for ping pong
        this.pingPongInterval = setInterval(() => {
            // If did not get pong twice from the client
            if (this.pingPong >= 2) {
                return this.disconnect(1000, 'Did not get pong');
            }
            // Send ping
            this.send('_0', null, 'ping');
            // Mark that ping pong sent
            this.pingPong++;
        }, this.server.options.pingPongInterval);


        // Create listener for publish event to handle all published messages
        this.publishListener = (msg: any) => {
            let exFn = this.channels[msg.channel];
            if (exFn) exFn(msg.data);
            return;
        };

        this.server.on('publish', this.publishListener);

        this._socket.on('message', (msg: any) => {
            // If got pong from client
            if (msg === '_1') {
                // Mark that ping pong revived
                return this.pingPong--;
            }
            msg = JSON.parse(msg);
            if (msg.action === 'emit') {
                let fn: any = this.events[msg.event];
                if (fn) fn(msg.data);
                return;
            }

            // Pub Sub functions
            if (msg.action === 'publish') {
                if (this.channels[msg.channel]){
                    this.server.webSocketServer.publish(msg.channel, msg.data, false);
                    this.publishListener(msg);
                }
                return;
            }
            if (msg.action === 'internal') {
                if (msg.event === 'subscribe') {
                    this.channels[msg.data] = (data: any) => {
                        this.send(msg.data, data, 'publish');
                    };
                    return;
                }
                if (msg.event === 'unsubscribe') {
                    if (this.channels[msg.data]) {
                        this.channels[msg.data] = null;
                        delete this.channels[msg.data];
                    }
                    return;
                }
            }
            return;
        });


        this._socket.on('close', (code?: number, msg?: any) => {
            let fn: any = this.events['disconnect'];
            if (fn) fn(code, msg);

            clearInterval(this.pingPongInterval);
            this.server._unsubscribe('publish', this.publishListener);
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
            return;
        });

        this._socket.on('error', (err?: any) => {
            let fn: any = this.events['error'];
            if (fn) fn(err);
            return;
        });
    }

    // Function to register events
    on(event: string, fn: any) {
        if (this.events[event]) this.events[event] = null;
        return this.events[event] = fn;
    }

    // Function to send messages to the client
    send(event: string, data?: any, type?: string) {
        if (type === 'ping') return this._socket.send(event);
        if (type === 'internal') return this._socket.send(MessageFactory.internalMessage(event, data));
        if (type === 'publish') return this._socket.send(MessageFactory.publishMessage(event, data));
        return this._socket.send(MessageFactory.emitMessage(event, data));
    }

    //Close function
    disconnect(code?: number, message?: any) {
        return this._socket.close(code, message);
    }
}