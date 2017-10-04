import { Options } from '../../common/interfaces'
import { logError } from '../../common/console'
import { TcpSocket } from '../tcp/tcp'
import { createServer } from 'net'
import { processMessage } from '../../common/messages'

declare let process: any

export class Broker {
    servers: TcpSocket[] = []

    constructor(public options: Options, public id: number) {
        createServer((s: any) => {
            const socket: TcpSocket = new TcpSocket(s)
            const id: number = this.servers.length
            this.servers[id] = socket

            setInterval(() => socket.send('#0'), 20000)

            socket.on('error', (err: any): void => logError('Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n'))
            socket.on('message', (msg: any): any => msg !== '#1' ? this.broadcast(id, msg) : '')
            socket.on('disconnect', (): void => logError('Server ' + id + ' has disconnected'))
        }).listen(options.brokerPort)

        process.send(processMessage('ready', process.pid))
    }

    broadcast(id: number, msg: any): void {
        for (let i: number = 0, len: number = this.servers.length; i < len; i++) {
            if (i !== id) this.servers[i].send(msg)
        }
    }
} 