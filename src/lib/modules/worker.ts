import * as WebSocket from 'uws';

import { Socket } from './socket/socket';
import { Options } from '../options';
import { TcpSocket } from './pubsub-server/tcp-socket';
import { EventEmitter } from './eventEmitter/eventEmitter';
import { MessageFactory } from './messages/messages';
import { Server, createServer } from 'http';

/**
 * Main worker file where all http and Socket and
 * Broker connections are created.
 *
 * all functions which starts from '_' are private
 */
declare let process: any;

export class Worker extends EventEmitter {

    id: number;
    broker: TcpSocket;
    httpServer: Server;
    webSocketServer: any;

    constructor(public options: Options) {
        super();
        this.id = this.options.id;

        Worker._connectBroker(this);
        Worker._connectHttpServer(this);
        Worker._connectWebSocketServer(this);
    }


    /**
     * Establish communication between
     * broker and worker.
     *
     * Listen on ping form the server '_0' and
     * replay pong '_1'.
     *
     * In case of errors put in in console
     */
    static _connectBroker(self: Worker) {
        self.broker = new TcpSocket(self.options.brokerPort, '127.0.0.1');
        self.broker.on('message', (msg: any) => {
            if (msg === '_0') return self.broker.send('_1');
            self.emit('publish', JSON.parse(msg));
        });
        self.broker.on('disconnect', () => {
            console.log('\x1b[31m%s\x1b[0m', 'Broker has been disconnected');
        });
        self.broker.on('error', (err: any) => {
            console.log('\x1b[31m%s\x1b[0m', 'Worker' + ', PID ' + process.pid + '\n' + err.stack + '\n');
        })
    }

    /**
     *  Create http server and bind it to the global
     *  worker variable.
     *
     *  print to console that worker has been connected
     */
    static _connectHttpServer(self: Worker) {
        self.httpServer = createServer();
        self.httpServer.listen(self.options.port, () => {
            console.log('\x1b[36m%s\x1b[0m', '          Worker: ' + self.options.id + ', PID ' + process.pid);
        });
    }

    /**
     *  Connect uWebSocket library,
     *  create new Socket from the custom socket and
     *  send it to the user.
     *
     *  Make uWS available to the user with restriction to 'on' event
     *  Add new event 'publish'
     */
    static _connectWebSocketServer(self: Worker) {
        let webSocketServer = new WebSocket.Server({ server: self.httpServer });

        webSocketServer.on('connection', (_socket: WebSocket) => {
            let socket = new Socket(_socket, self);
            self.emit('connection', socket);
        });

        self.webSocketServer = webSocketServer;
        self.webSocketServer.on = (event: string, fn: any) => {
            self.on(event, fn);
        };

        self.webSocketServer.publish = (channel: string, data?: any) => {
            self.broker.send(MessageFactory.brokerMessage(channel, data));
            self.emit('publish', { channel: channel, data: data });
        }
    }
}