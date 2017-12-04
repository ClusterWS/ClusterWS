import * as WebSocket from 'uws'
import * as HTTPS from 'https'
import { Socket } from './socket/socket'
import { Broker } from '../broker/broker'
import { SocketServer } from './socket/server'
import { IOptions, IObject } from '../utils/utils'
import { Server, createServer } from 'http'

declare const process: any

export class Worker {
    public httpServer: Server | HTTPS.Server
    public httpsServer: Server | HTTPS.Server
    public socketServer: SocketServer = new SocketServer()

    constructor(public options: IOptions, serverConfigs: IObject) {
        Broker.Client('ws://127.0.0.1:' + options.brokerPort, serverConfigs.internalKey, this.socketServer)
        this.options.secureProtocolOptions

        const server: Server | HTTPS.Server = this.options.secureProtocolOptions ?
            HTTPS.createServer({
                key: this.options.secureProtocolOptions.key,
                cert: this.options.secureProtocolOptions.cert,
                ca: this.options.secureProtocolOptions.ca
            }) : createServer()

        new WebSocket.Server({ server })
            .on('connection', (socket: WebSocket) => this.socketServer.emit('connection', new Socket(socket, this)))

        this.options.secureProtocolOptions ? this.httpsServer = server : this.httpServer = server
        server.listen(this.options.port, (): void => {
            this.options.worker.call(this)
            process.send({ event: 'READY', data: process.pid })
        })
    }
}