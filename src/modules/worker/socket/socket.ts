import { Worker } from '../worker'
import { EventEmitter } from '../../utils/emitter'
import { logError } from '../../utils/utils'
import { socketDecodeMessages, socketEncodeMessages } from './messages'

export class Socket {
    public channels: any[] = []
    public events: EventEmitter = new EventEmitter()
    private missedPing: number = 0

    constructor(public socket: any, public server: Worker) {
        const onPublish: any = (message: any): void | any => this.channels.indexOf(message.channel) !== -1 ? this.send(message.channel, message.data, 'publish') : ''
        this.server.socketServer.on('#publish', onPublish)

        const pingInterval: any = setInterval((): void => {
            if (this.missedPing++ > 2) return this.disconnect(4001, 'Did not get pongs')
            this.send('#0', null, 'ping')
        }, this.server.options.pingInterval)
        this.send('configuration', { ping: this.server.options.pingInterval, binary: this.server.options.useBinary }, 'system')

        this.socket.on('error', (err: any): void => this.events.emit('error', err))
        this.socket.on('message', (message: any): any => {
            if (this.server.options.useBinary && typeof message !== 'string') message = Buffer.from(message).toString()
            if (message === '#1') return this.missedPing = 0
            try {
                message = JSON.parse(message)
            } catch (e) { return logError('PID: ' + process.pid + '\n' + e + '\n') }

            socketDecodeMessages(this, message)
        })
        this.socket.on('close', (code: number, reason: any): void => {
            clearInterval(pingInterval)
            this.events.emit('disconnect', code, reason)
            this.server.socketServer.removeListener('#publish', onPublish)

            for (const key in this) this.hasOwnProperty(key) ? delete this[key] : ''
        })
    }

    public on(event: string, listener: any): void {
        this.events.on(event, listener)
    }

    public send(event: string, data: any, type?: string): void {
        if (this.server.options.useBinary && event !== 'configuration') return this.socket.send(Buffer.from(socketEncodeMessages(event, data, type || 'emit')))
        this.socket.send(socketEncodeMessages(event, data, type || 'emit'))
    }

    public disconnect(code: number, reason: string): void {
        this.socket.close(code, reason)
    }
}