import * as HTTP from 'http'
import * as HTTPS from 'https'
import * as WebSocket from 'uws'

import { Socket } from './socket/socket'
import { Broker } from '../broker/broker'
import { SocketServer } from './socket/server'
import { IOptions, IObject, TListener } from '../utils/utils'

declare const process: any

export class Worker {
    public httpServer: HTTP.Server
    public httpsServer: HTTPS.Server
    public socketServer: SocketServer = new SocketServer()

    constructor(public options: IOptions, serverConfigs: IObject) {
        Broker.Client('ws://127.0.0.1:' + options.brokerPort, serverConfigs.internalKey, this.socketServer)
        this.options.secureProtocolOptions

        const server: HTTP.Server | HTTPS.Server = this.options.secureProtocolOptions ?
            HTTPS.createServer({
                key: this.options.secureProtocolOptions.key,
                cert: this.options.secureProtocolOptions.cert,
                ca: this.options.secureProtocolOptions.ca
            }) : HTTP.createServer()

        new WebSocket.Server({
            server,
            verifyClient: (info: IObject, callback: TListener): void =>
                this.socketServer.middleware.verifyConnection ?
                    this.socketServer.middleware.verifyConnection.call(null, info, callback) :
                    callback(true)
        }).on('connection', (socket: WebSocket) => this.socketServer.emit('connection', new Socket(socket, this)))

        server instanceof HTTPS.Server ? this.httpsServer = server : this.httpServer = server
        server.listen(this.options.port, (): void => {
            this.options.worker.call(this)
            process.send({ event: 'READY', data: process.pid })
        })
    }
}