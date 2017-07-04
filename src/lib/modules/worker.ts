import * as WebSocket from 'uws';
import * as net from 'net';

import JsonSocket = require( "json-socket");

import {createServer} from 'http';
import {EventEmitter, ListenerFn} from 'eventemitter3';
import {Options} from '../options';
import {Socket} from './socket/socket';
import {MessageFactory} from '../messages/messages';



export class Worker {
    // Create Worker variables
    id: number;
    broker: any;
    httpServer: any;
    webSocketServer: any;
    eventEmitter: EventEmitter;

    constructor(public options: Options) {
        // Assign worker variables
        this.id = this.options.id;
        this.eventEmitter = new EventEmitter();
        this.connectBroker();
        // Create usual http server
        this.httpServer = createServer().listen(this.options.port, () => {
            console.log('\x1b[36m%s\x1b[0m', '          Worker: ' + this.options.id + ', PID ' + process.pid);
        });

        // Create WebSocket server with UWS
        let webSocketServer = new WebSocket.Server({server: this.httpServer});
        webSocketServer.on('connection', (_socket: WebSocket) => {
            // Create new Socket
            let socket = new Socket(_socket, this);
            // Emit event to the user
            this.emit('connection', socket);
        });

        // Make WebSocket server available for user with some bounds
        this.webSocketServer = webSocketServer;
        // Reassign WebSocket on event on new server on event
        this.webSocketServer.on = (event: string, fn: ListenerFn, context?: string) => {
            this.on(event, fn, context);
        };
        // Make available publish event to the client
        this.webSocketServer.publish = (channel: string, data?: any) => {
            this.broker.sendMessage(MessageFactory.brokerMessage(channel, data));
            this.emit('publish', {channel: channel, data: data});
        }
    }

    // Make user be able use on event on the server variable
    on(event: string, fn: ListenerFn, context?: string) {
        this.eventEmitter.on(event, fn, context);
    }

    // Make user be able use emit event on the server variable
    emit(event: string, data?: any) {
        this.eventEmitter.emit(event, data);
    }

    // Unsubscribe event from Event emitter
    // TODO: Remove unsubscribe event from the access of user
    unsubscribe(event: string, fn: ListenerFn, context?: string) {
        console.log(this.eventEmitter.listeners(event));
        this.eventEmitter.removeListener(event, fn, context);
        console.log(this.eventEmitter.listeners(event));
    }

    // Connect broker socket
    connectBroker() {
        // Create connection to the broker
        this.broker = new JsonSocket(new net.Socket());
        this.broker.connect(this.options.brokerPort, '127.0.0.1');
        // Listen on the messages from the broker
        this.broker.on('message', (msg: any) => {
            if (msg === '_0') return this.broker.sendMessage('_1');
            this.emit('publish', JSON.parse(msg));
        });
        // Listen on event close and try to reconnect if it has disconnected
        // TODO: make reconnection better
        this.broker.on('close', () => {
            this.connectBroker();
        });
    }
}