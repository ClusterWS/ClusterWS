import * as HTTP from 'http'
import * as HTTPS from 'https'
import * as WebSocket from 'uws'

import { Socket } from './socket/socket'
import { WSServer } from './socket/wsserver'
import { BrokerClient } from './broker/client'
import { Options, CustomObject, Listener } from '../utils/types'

export class Worker {
  public wss: WSServer = new WSServer()
  public server: HTTP.Server | HTTPS.Server
  public options: Options

  constructor(options: Options, securityKey: string) {
    this.options = options

    for (let i: number = 0; i < this.options.brokers; i++)
      BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[i]}`, securityKey, this.wss)

    this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer()

    new WebSocket.Server({
      server: this.server,
      verifyClient: (info: CustomObject, callback: Listener): void =>
        this.wss.middleware.verifyConnection ?
          this.wss.middleware.verifyConnection.call(null, info, callback) : callback(true)
    }).on('connection', (socket: WebSocket) => this.wss.emit('connection', new Socket(this, socket)))

    this.server.listen(this.options.port, this.options.host, (): void => {
      this.options.worker.call(this)
      process.send({ event: 'READY', pid: process.pid })
    })

  }
}