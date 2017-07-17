import { Options } from '../../options';
import { TcpSocket } from './tcp-socket';
import { createServer, Server } from 'net';

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
    servers: TcpSocket[] = [];
    brokerServer: Server;

    constructor(public options: Options) {
        console.log('\x1b[36m%s\x1b[0m', '>>> Broker on: ' + this.options.brokerPort + ', PID ' + process.pid);

        this.brokerServer = createServer((socket: any) => {
            socket = new TcpSocket(socket);

            let length: number = this.servers.length;
            socket.id = length;
            socket.pingInterval = setInterval(() => {
                socket.send('_0');
            }, 20000);

            this.servers[length] = socket;

            socket.on('message', (msg: any) => {
                if (msg === '_1') return;
                this.broadcast(socket.id, msg);
            });

            socket.on('disconnect', () => {
                console.log('socket disconnected');
            });

            socket.on('error', (err: any) => {
                console.error('\x1b[31m%s\x1b[0m', 'Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n');
            });
        });
        this.brokerServer.listen(this.options.brokerPort);
    }

    /**
     * Broadcast message to all workers except one from which it was sent.
     */
    broadcast(id: number, msg: any) {
        for (let i: number = 0, len = this.servers.length; i < len; i++) {
            if (id !== i) this.servers[i].send(msg);
        }
    }
}