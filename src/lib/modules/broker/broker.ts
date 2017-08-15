import { _ } from '../../utils/fp'
import { logError } from '../../utils/logs'
import { Options } from '../../options'
import { TcpSocket } from '../tcp/socket'
import { processMessages } from '../../communication/messages'
import { createServer, Server } from 'net'

declare let process: any

export class Broker {
    broker: Server
    servers: TcpSocket[] = []

    constructor(public options: Options, public id: number) {

        this.broker = createServer((s) => {
            let id = this.servers.length
            let socket = new TcpSocket(s)
            let ping = setInterval(() => socket.send('#0'), 20000)

            this.servers[id] = socket

            socket.on('error', (err: any) => logError('Broker' + ', PID ' + process.pid + '\n' + err.stack + '\n'))
            socket.on('message', (msg: any) => msg !== '#1' ? this.broadcast(id, msg) : '')
            socket.on('disconnect', () => logError('Server ' + id + ' has disconnected'))
        }).listen(options.brokerPort)

        process.send(processMessages('ready', process.pid))
    }

    broadcast(id: number, msg: any) {
        _.map((server: any, index: number) => index !== id ? server.send(msg) : '', this.servers)
    }
}