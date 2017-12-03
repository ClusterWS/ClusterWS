import * as WebSocket from 'uws'
import * as HTTPS from 'https'
import { Socket } from './socket/socket'
import { Broker } from '../broker/broker'
import { SocketServer } from './socket/server'
import { Server, createServer } from 'http'

import { IOptions, IObject } from '../utils/utils'

declare const process: any

export class Worker {
    public httpServer: Server = createServer()
    public httpsServer: HTTPS.Server
    public socketServer: SocketServer = new SocketServer()

    constructor(public options: IOptions, serverConfigs: IObject) {
        Broker.Client('ws://127.0.0.1:' + options.brokerPort, serverConfigs.internalKey, this.socketServer)

        if (this.options.sslOptions) {
            this.httpsServer = HTTPS.createServer({
                key: this.options.sslOptions.key,
                cert: this.options.sslOptions.cert,
                ca: this.options.sslOptions.ca
            })
            this.httpsServer.listen(this.options.sslOptions.port)
        }

        new WebSocket.Server({ server: this.options.sslOptions ? this.httpsServer : this.httpServer })
            .on('connection', (socket: WebSocket) => this.socketServer.emit('connection', new Socket(socket, this)))

        this.httpServer.listen(this.options.port, (): void => {
            this.options.worker.call(this)
            process.send({ event: 'READY', data: process.pid })
        })
    }
}