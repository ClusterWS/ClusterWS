import * as uws from 'uws'

import { Options } from '../../options'
import { logError } from '../../utils/logs'
import { TcpSocket } from '../tcp/socket'
import { createServer } from 'http'
import { EventEmitter } from '../../utils/eventemitter'
import { processMessages } from '../../communication/messages'
import { Socket } from './socket/socket'

declare let process: any

export class Worker {
    httpServer: any
    socketServer: any = {}

    constructor(public options: Options) {
        let brokerConnection: TcpSocket = new TcpSocket(this.options.brokerPort, '127.0.0.1')
        brokerConnection.on('error', (err: any) => logError('Worker' + ', PID ' + process.pid + '\n' + err.stack + '\n'))
        brokerConnection.on('message', (msg: any) => msg === '#0' ? brokerConnection.send('#1') : this.socketServer.emitter.emit('#publish', msg))
        brokerConnection.on('disconnect', () => logError('Broker has been disconnected'))

        this.socketServer.emitter = new EventEmitter()
        this.socketServer.on = this.socketServer.emitter.on

        this.httpServer = createServer().listen(this.options.port)

        let uWS: any = new uws.Server({ server: this.httpServer })
        uWS.on('connection', (socket: any) => this.socketServer.emitter.emit('connection', new Socket(socket, this.socketServer.on)))

        this.options.worker.call(this)

        process.send(processMessages('ready', process.pid))
    }
}