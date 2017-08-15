import * as uws from 'uws'

import { Socket } from './socket/socket'
import { Options } from '../../options'
import { logError } from '../../utils/logs'
import { TcpSocket } from '../tcp/socket'
import { createServer } from 'http'
import { EventEmitter } from '../../utils/eventemitter'
import { processMessages, brokerMessage } from '../../communication/messages'

declare let process: any

export class Worker {
    publish: any
    httpServer: any
    socketServer: any = {}

    constructor(public options: Options, public id: number) {
        let brokerConnection: TcpSocket = new TcpSocket(this.options.brokerPort, '127.0.0.1')
        brokerConnection.on('error', (err: any) => logError('Worker' + ', PID ' + process.pid + '\n' + err.stack + '\n'))
        brokerConnection.on('message', (msg: any) => msg === '#0' ? brokerConnection.send('#1') : this.socketServer.emitter.emit('#publish', JSON.parse(msg)))
        brokerConnection.on('disconnect', () => logError('Broker has been disconnected'))

        this.publish = (channel: string, data: any) => {
            brokerConnection.send(brokerMessage(channel, data))
            this.socketServer.emitter.emit('#publish', { channel: channel, data: data })
        }

        this.socketServer.emitter = new EventEmitter()
        this.socketServer.on = (event: string, fn: any) => this.socketServer.emitter.on(event, fn)

        this.httpServer = createServer().listen(this.options.port)

        let uWS: any = new uws.Server({ server: this.httpServer })
        uWS.on('connection', (socket: any) => {
            console.log(this.id)
            this.socketServer.emitter.emit('connection', new Socket(socket, this.socketServer.emitter, this.options))
        })

        this.options.worker.call(this)

        process.send(processMessages('ready', process.pid))
    }
}