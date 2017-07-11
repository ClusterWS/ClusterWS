import * as net from 'net';
import {Options} from '../../options';
import {TcpSocket} from './tcp-socket';
import {MessageFactory} from '../messages/messages';

/**
 * Broker is using to communicate between workers and pass big amount
 * of data trough TCP socket.
 *
 * net.createServer() this line create TCP server
 *
 * .listen start to listen on all connections from port which was passed
 * in options
 */
declare let process: any;

export class Broker {
    servers: any = [];
    brokerServer: any;

    constructor(public options: Options) {
        console.log('\x1b[36m%s\x1b[0m', '>>> Broker on: ' + this.options.brokerPort + ', PID ' + process.pid);

        this.brokerServer = net.createServer();
        this.brokerServer.listen(this.options.brokerPort);

        this.brokerServer.on('connection', (socket: any) => {
            socket = new TcpSocket(socket);

            let length: number = this.servers.length;
            socket.id = length;
            socket.pingInterval = setInterval(() => {
                socket.send('_0');
            }, 5000);

            this.servers[length] = socket;

            socket.on('message', (msg: any) => {
                if (msg === '_1') return;
                this.broadcast(socket.id, msg);
            });

            socket.on('disconnect', () => {
                console.log('socket disconnected');
            });

            socket.on('error', (err: any) => {
                process.send(MessageFactory.processMessages('error', MessageFactory.processErrors(err.toString(), 'Broker', process.pid)));
            });
        });
    }

    /**
     * Broadcast message to all workers except one from which it was sent.
     */
    broadcast(id: number, msg: any) {
        for (let i: number = 0, len = this.servers.length; i < len; i++) {
            if (id !== i) {
                this.servers[i].send(msg);
            }
        }
    }
}