import { Server } from 'uws'
import { Socket } from './socket'
import { Options } from '../../common/interfaces'
import { logError } from '../../common/console'
import { TcpSocket } from '../tcp/tcp'
import { createServer } from 'http'
import { EventEmitter } from '../../common/emitter'
import { processMessage, brokerMessage } from '../../common/messages'

declare let process: any

export class Worker {
    httpServer: any
    socketServer: any

    constructor(public options: Options, public info: number) {
        const broker: TcpSocket = new TcpSocket(this.options.brokerPort, '127.0.0.1')
        broker.on('error', (err: any): void => logError('Worker' + ', PID ' + process.pid + '\n' + err.stack + '\n'))
        broker.on('message', (msg: any): void => msg === '#0' ? broker.send('#1') : this.socketServer.emitter.emit('#publish', JSON.parse(msg)))
        broker.on('disconnect', (): void => logError('Something went wrong, broker has been disconnected'))

        this.socketServer = {
            middleware: {},
            emitter: new EventEmitter(),
            on: (event: string, fn: any): void => this.socketServer.emitter.on(event, fn),
            publish: (channel: string, data?: any): void => {
                broker.send(brokerMessage(channel, data))
                this.socketServer.emitter.emit('#publish', { channel, data })
            }
        }

        this.httpServer = createServer().listen(this.options.port, () => {
            const uws: Server = new Server({ server: this.httpServer })
            uws.on('connection', (socket: any) => this.socketServer.emitter.emit('connection', new Socket(socket, this)))

            this.options.worker.call(this)
            process.send(processMessage('ready', process.pid))
        })
    }
}