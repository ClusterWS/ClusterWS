import * as http from 'http';
import * as WebSocket from 'uws';

import {Socket} from './socket/socket';
import {Options} from '../options';
import {TcpSocket} from './pubsub-server/tcp-socket';
import {EventEmitter} from './eventEmitter/eventEmitter';
import {MessageFactory} from './messages/messages';

/**
 * Main worker file where all http and Socket and
 * Broker connections are created.
 *
 * all functions which starts from '_' are private
 */

declare let process: any;

export class Worker extends EventEmitter{

    id: number;
    broker: any;
    httpServer: any;
    webSocketServer: any;

    constructor(public options: Options) {
        super();
        this.id = this.options.id;

        this._connectBroker();
        this._connectHttpServer();
        this._connectWebSocketServer();
    }


    /**
     * Establish communication between
     * broker and worker.
     *
     * Listen on ping form the server '_0' and
     * replay pong '_1'.
     *
     * In case of errors send error to the
     *
     * TODO: make broker reconnection
     */
    _connectBroker() {
        this.broker = new TcpSocket(this.options.brokerPort, '127.0.0.1');
        this.broker.on('message', (msg: any) => {
            if (msg === '_0') return this.broker.send('_1');
            this.emit('publish', JSON.parse(msg));
        });
        this.broker.on('disconnect', () => {
            console.log('\x1b[31m%s\x1b[0m', 'Broker has been disconnected');
        });
        this.broker.on('error', (err: any) => {
            console.log('\x1b[31m%s\x1b[0m', 'Worker' + ', PID ' + process.pid + '\n' + err + '\n');
        })
    }

    /**
     *  Create http server and bind it to the global
     *  worker variable.
     *
     *  print to console that worker has been connected
     */
    _connectHttpServer() {
        this.httpServer = http.createServer();
        this.httpServer.listen(this.options.port, () => {
            console.log('\x1b[36m%s\x1b[0m', '          Worker: ' + this.options.id + ', PID ' + process.pid);
        });
    }

    /**
     *  Connect uWebSocket library and
     *  create new Socket from the custom socket and
     *  send it to the user.
     *
     *  Make uWS available to the user with restriction to 'on' event
     *
     *  Add new event 'publish'
     *
     */

    _connectWebSocketServer() {
        let webSocketServer = new WebSocket.Server({server: this.httpServer});

        webSocketServer.on('connection', (_socket: WebSocket) => {
            let socket = new Socket(_socket, this);
            this.emit('connect', socket);
        });

        this.webSocketServer = webSocketServer;
        this.webSocketServer.on = (event: string, fn: any) => {
            this.on(event, fn);
        };

        this.webSocketServer.publish = (channel: string, data?: any) => {
            this.broker.send(MessageFactory.brokerMessage(channel, data));
            this.emit('publish', {channel: channel, data: data});
        }
    }
}