import * as _ from '../../../utils/fp'
import { Options } from '../../options'
import { tcpSocket } from '../tcp/socket'
import { createServer } from 'net'

export function broker(options: Options) {
    let servers: any[]

    let connectBroker = _.curry((options: Options, fn: any) => createServer(fn).listen(options.brokerPort))
    let switchSocket = (socket: any) => tcpSocket(socket)
    let handleSockets = (socket: any) => { }

    let addSocket = (socket: any) => {
        servers.push(socket)
        return { socket: socket, id: servers.length - 1 }
    }
    let onMessage = (data: {socket:any, id:number}) => {}

    connectBroker(options, _.compose(handleSockets, switchSocket))
}


//  servers: TcpSocket[] = [];
//     brokerServer: Server;

//     constructor(public options: Options) {
//         console.log('\x1b[36m%s\x1b[0m', '>>> Broker on: ' + this.options.brokerPort + ', PID ' + process.pid);

//         this.brokerServer = createServer((socket: any) => {
//             socket = new TcpSocket(socket);

//             let length: number = this.servers.length;
//             socket.id = length;
//             socket.pingInterval = setInterval(() => {
//                 socket.send('_0');
//             }, 20000);

//             this.servers[length] = socket;

//             socket.on('message', (msg: any) => {
//                 if (msg === '_1') return;
//                 this.broadcast(socket.id, msg);
//             });

//             socket.on('disconnect', () => {
//                 console.log('socket disconnected');
//             });

//             socket.on('error', (err: any) => {
//                 console.error('\x1b[31m%s\x1b[0m', 'Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n');
//             });
//         });
//         this.brokerServer.listen(this.options.brokerPort);
//     }

//     /**
//      * Broadcast message to all workers except one from which it was sent.
//      */
//     broadcast(id: number, msg: any) {
//         for (let i: number = 0, len = this.servers.length; i < len; i++) {
//             if (id !== i) this.servers[i].send(msg);
//         }
//     }