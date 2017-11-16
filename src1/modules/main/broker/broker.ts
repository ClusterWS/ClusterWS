import { Options } from '../../common/interfaces'
import { logError } from '../../common/console'
import { TcpSocket } from '../tcp/tcp'
import { createServer } from 'net'
import { processMessage } from '../../common/messages'

declare let process: any

export class Broker {
    servers: TcpSocket[] = []

    constructor(public options: Options, public info: number) {
        createServer((s: any) => {
            const socket: TcpSocket = new TcpSocket(s)

            this.setUniqueId(socket)
            setInterval(() => socket.send('#0'), 20000)

            socket.on('error', (err: any): void => logError('Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n'))
            socket.on('message', (msg: any): any => msg !== '#1' ? this.broadcast(socket.id, msg) : '')
            socket.on('disconnect', (): void => {
                this.removeSocket(socket.id)
                logError('Server ' + socket.id + ' has disconnected')
            })
        }).listen(options.brokerPort, () => process.send(processMessage('ready', process.pid)))
    }

    setUniqueId(socket: TcpSocket): any {
        socket.id = Math.floor(100000 + Math.random() * 99999999)

        if (this.servers.length === 0) return this.servers.push(socket)
        for (let i: number = 0, len: number = this.servers.length; i < len; i++) {
            if (this.servers[i].id === socket.id) return this.setUniqueId(socket)
            if (i === len - 1) return this.servers.push(socket)
        }
    }

    broadcast(id: number, msg: any): void {
        for (let i: number = 0, len: number = this.servers.length; i < len; i++) {
            if (this.servers[i].id !== id) this.servers[i].send(msg)
        }
    }

    removeSocket(id: number): any {
        for (let i: number = 0, len: number = this.servers.length; i < len; i++) {
            if (this.servers[i].id === id) return this.servers.splice(i, 1)
        }
    }
} 