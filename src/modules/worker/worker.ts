import * as HTTP from 'http'
import * as HTTPS from 'https'
import * as WebSocket from 'uws'

import { BrokerClient } from '../broker/client'
import { WSServer } from './socket/wsserver'
import { Options, CustomObject, Listener } from '../../utils/interfaces'

export class Worker {
    public wss: WSServer = new WSServer()
    public server: HTTP.Server | HTTPS.Server

    constructor(public options: Options, key: string) {
        for (let i: number = 0; i < this.options.brokers; i++)
            BrokerClient({
                key,
                external: false,
                url: 'ws://127.0.0.1:' + this.options.brokersPorts[i],
                broadcaster: this.wss
            })
        this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer()

        new WebSocket.Server({
            server: this.server,
            verifyClient: (info: CustomObject, callback: Listener): void =>
                this.wss.middleware.verifyConnection ?
                    this.wss.middleware.verifyConnection.call(null, info, callback) : callback(true)
        })
        // TODO: Complete on connect and pass back reference to socket

        this.server.listen(this.options.port, (): void => {
            this.options.worker.call(this)
            process.send({ event: 'READY', pid: process.pid })
        })
    }
}