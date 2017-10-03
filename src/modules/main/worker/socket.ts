import { Worker } from './worker'
import { logError } from '../../common/console'
import { EventEmitter } from '../../common/emitter'
import { socketDecodeMessages } from '../../common/messages'




export class Socket {
    events: EventEmitter
    channels: any[]

    constructor(public socket: any, public server: Worker) {

        const onPublish: any = (message: any) => { }
        this.server.socketServer.emitter.on('#publish', onPublish)

        let lost: number = 0
        const pingInterval = setInterval(() => {
            if (lost++ > 2) return // complete errror on lost ping
            // complete writing message ping
        }, this.server.options.pingInterval)

        this.events = new EventEmitter()
        this.channels = []

        this.socket.on('message', (message: any) => {
            if (message === '#1') return lost = 0

            try {
                message = JSON.parse(message)
            } catch (e) { return logError('PID: ' + process.pid + '\n' + e + '\n') }

            socketDecodeMessages(this, message)
        })

        this.socket.on('error')
        this.socket.on('close')
    }
}