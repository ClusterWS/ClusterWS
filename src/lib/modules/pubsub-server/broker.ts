import {Options} from '../../options';
import * as net from 'net';
import JsonSocket = require( "json-socket");


export class Broker {
    servers: any = [];
    brokerServer: any;

    constructor(public options: Options) {
        this.brokerServer = net.createServer();
        this.brokerServer.listen(this.options.brokerPort);
        console.log('\x1b[36m%s\x1b[0m', '>>> Broker on: ' + this.options.brokerPort + ', PID ' + process.pid);

        this.brokerServer.on('connection', (socket: any) => {
            socket = new JsonSocket(socket);

            let length: number = this.servers.length;
            socket.id = length;
            socket.pingInterval = setInterval(() => {
                socket.sendMessage('_0');
            }, 20000);

            this.servers[length] = socket;

            socket.on('message', (msg: any) => {
                if (msg === '_1') return;
                this.broadcast(socket.id, msg);
            });
            socket.on('close', () => {
                clearInterval(this.servers[socket.id].pingInterval);
                this.servers[socket.id] = null;
                this.servers.splice(socket.id, 1);
            });
        });
    }

    broadcast(id: number, msg: any) {
        for (let i: number = 0, len = this.servers.length; i < len; i++) {
            if (id !== i) {
                this.servers[i].sendMessage(msg)
            }
        }
    }
}