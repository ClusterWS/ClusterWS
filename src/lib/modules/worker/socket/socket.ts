import { _ } from '../../../utils/fp'
import { Options } from '../../../options'
import { EventEmitter } from '../../../utils/eventemitter'
import { socketMessages } from '../../../communication/messages'

/* 
'p' = publish
'e' = emit
's' = system
's' 's' = system subscribe
's' 'u' = system unsubscribe
's' 'c' = configuration
*/

export class Socket {
    channels: any = []
    events: EventEmitter = new EventEmitter()

    constructor(public socket: any, server: any) {
        let publishListener = (msg: any) => this.channels.indexOf(msg.channel) !== -1 ? this.send(msg.channel, msg.data, 'publish') : ''
        server.socketServer.emitter.on('#publish', publishListener)

        let missedPing: number = 0
        let pingInterval = setInterval(() => (missedPing++) > 2 ? this.disconnect(3001, 'No pongs from socket') : this.send('#0', null, 'ping'), server.options.pingInterval)

        this.send('configuration', {}, 'system')

        this.socket.on('error', (err: any) => this.events.emit('error', err))
        this.socket.on('close', (code: number, msg: any) => {
            this.events.emit('disconnect', code, msg)

            clearInterval(pingInterval)
            this.events.removeAllEvents()
            server.socketServer.emitter.removeListener('#publish', publishListener)

            for (let key in this) if (this.hasOwnProperty(key)) {
                this[key] = null
                delete this[key]
            }
        })
        this.socket.on('message', (msg: any) => {
            console.log(msg)
            if (msg === '#1') return missedPing = 0

            msg = JSON.parse(msg)

            _.switchcase({
                'p': () => this.channels.indexOf(msg.m[1]) !== -1 ? server.socketServer.publish(msg.m[1], msg.m[2]) : '',
                'e': () => this.events.emit(msg.m[1], msg.m[2]),
                's': () => _.switchcase({
                    's': () => this.channels.indexOf(msg.m[2]) === -1 ? this.channels.push(msg.m[2]) : '',
                    'u': () => this.channels.indexOf(msg.m[2]) !== -1 ? this.channels.splice(this.channels.indexOf(msg.m[2]), 1) : ''
                })(msg.m[1])
            })(msg.m[0])
        })
    }

    on(event: string, fn: any) {
        this.events.on(event, fn)
    }

    send(event: string, data: any, type?: string) {
        this.socket.send(socketMessages(event, data, type || 'emit'))
    }

    disconnect(code?: number, msg?: any) {
        this.socket.close(code, msg)
    }
}