import * as HTTP from 'http'
import * as HTTPS from 'https'
import * as WebSocket from 'uws'

import { Options, CustomObject, Listener } from '../../utils/utils'
import { BrokerClient } from '../broker/broker'
import { WSServer } from './socket/wsserver'
import { Socket } from './socket/socket'

export class Worker {
    public wss: WSServer = new WSServer()
    public server: HTTP.Server | HTTPS.Server

    constructor(public options: Options, key: string) {
        for (let i: number = 0; i < options.brokers; i++)
            BrokerClient('ws://127.0.0.1:' + this.options.brokersPorts[i], key, this.wss)

        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer()

        new WebSocket.Server({
            server: this.server,
            verifyClient: (info: CustomObject, callback: Listener): void =>
                this.wss.middleware.verifyConnection ?
                    this.wss.middleware.verifyConnection.call(null, info, callback) : callback(true)
        }).on('connection', (socket: WebSocket) => this.wss.emit('connection', new Socket(this, socket)))

        this.server.listen(this.options.port, (): void => {
            this.options.worker.call(this)
            process.send({ event: 'READY', pid: process.pid })
        })
    }
}