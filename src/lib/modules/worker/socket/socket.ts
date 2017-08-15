import { _ } from '../../../utils/fp'
import { Options } from '../../../options'
import { EventEmitter } from '../../../utils/eventemitter'
import { socketMessages } from '../../../communication/messages'


export class Socket {
    channels: any = ['world']
    events: EventEmitter = new EventEmitter()

    constructor(public socket: any, pubsub: any, options: Options) {

        let publishListener = (msg: any) => this.channels.indexOf(msg.channel) !== -1 ? this.send(msg.channel, msg.data, 'pub') : ''
        pubsub.on('#publish', publishListener)

        let missedPing: number = 0
        let pingInterval = setInterval(() => (missedPing++) > 2 ? this.disconnect(3001, 'No pongs from socket') : this.send('#0', null, 'ping'), options.pingInterval)

        this.socket.on('message', (msg: any) => {
            msg === '#1' ? missedPing = 0 : msg = JSON.parse(msg)

            _.switchcase({
                'p': () => pubsub.emit(msg.m[1], msg.m[2]),
                'e': () => this.events.emit(msg.m[1], msg.m[2]),
                's': () => _.switchcase({
                    'subscribe': () => this.channels.indexOf(msg.m[2]) !== -1 ? this.channels.push(msg.m[2]) : '',
                    'unsubscribe': () => this.channels.removeEvent(msg.m[2])
                })(msg.m[1])
            })(msg.m[0])
        })

        this.socket.on('close', (code: number, msg: any) => {
            this.events.emit('disconnect', code, msg)

            clearInterval(pingInterval)

            this.events.removeAllEvents()
            for (let key in this) if (this.hasOwnProperty(key)) {
                this[key] = null
                delete this[key]
            }
        })

        this.socket.on('error', (err: any) => this.events.emit('error', err))
    }

    on(event: string, fn: any) {
        this.events.on(event, fn)
    }

    send(event: string, data: any, type?: string) {
        this.socket.send(socketMessages(event, data, type || 'emt'))
    }

    disconnect(code?: number, msg?: any) {
        this.socket.close(code, msg)
    }
}