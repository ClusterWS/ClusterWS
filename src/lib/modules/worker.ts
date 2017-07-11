import * as WebSocket from 'uws';
import { TcpSocket } from './pubsub-server/tcp-socket';
import {createServer} from 'http';
import {EventEmitter, ListenerFn} from 'eventemitter3';
import {Options} from '../options';
import {Socket} from './socket/socket';
import {MessageFactory} from './messages/messages';



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
            this.emit('connect', socket);
        });

        // Make WebSocket server available for user with some bounds
        this.webSocketServer = webSocketServer;
        // Reassign WebSocket on event on new server on event
        this.webSocketServer.on = (event: string, fn: ListenerFn, context?: string) => {
            this.on(event, fn, context);
        };
        // Make available publish event to the client
        this.webSocketServer.publish = (channel: string, data?: any) => {
            this.broker.send(MessageFactory.brokerMessage(channel, data));
        }
    }

    // Unsubscribe event from Event emitter
    _unsubscribe(event: string, fn: ListenerFn, context?: string) {
        this.eventEmitter.removeListener(event, fn, context);
    }

    // Make user be able use on event on the server variable
    on(event: string, fn: ListenerFn, context?: string) {
        this.eventEmitter.on(event, fn, context);
    }

    // Make user be able use emit event on the server variable
    emit(event: string, data?: any) {
        this.eventEmitter.emit(event, data);
    }

    // Connect broker socket
    connectBroker() {
        this.broker = new TcpSocket(this.options.brokerPort, '127.0.0.1');

        this.broker.on('message', (msg: any)=>{
            if (msg === '_0') return this.broker.send('_1');
            this.emit('publish', JSON.parse(msg));
        });

        this.broker.on('disconnect', ()=>{
            console.log('Broker disconnected');
        });
    }
}