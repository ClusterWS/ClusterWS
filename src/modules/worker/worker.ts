import { Server } from 'uws'
import { Broker } from '../broker/broker'
import { IOptions } from '../utils/utils'
import { createServer } from 'http'
import { SocketServer } from './socket/socketServer'
import { Socket } from './socket/socket'

declare let process: any

export class Worker {
    public httpServer: any = createServer()
    public socketServer: SocketServer = new SocketServer()

    constructor(public options: IOptions, info: any) {
        Broker.Client('ws://127.0.0.1:' + options.brokerPort, info.internalKey, this.socketServer)

        const uws: Server = new Server({ server: this.httpServer })
        uws.on('connection', (socket: any) => this.socketServer.emit('connection', new Socket(socket, this)))

        this.httpServer.listen(this.options.port, (): void => {
            this.options.worker.call(this)
            process.send({ event: 'Ready', data: process.pid })
        })
    }
}