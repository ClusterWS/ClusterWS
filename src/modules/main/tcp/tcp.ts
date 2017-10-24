import { EventEmitter } from '../../common/emitter'
import { Socket, connect } from 'net'

export class TcpSocket extends EventEmitter {
    socket: Socket
    backlog: any[]
    isSocket: Boolean
    inReconnect: Boolean

    constructor(public socketOrPort: any, public host?: string) {
        super()

        this.backlog = []
        this.isSocket = this.socketOrPort instanceof Socket
        this.create()
    }

    create(): void {
        this.socket = this.isSocket ? this.socketOrPort : connect(this.socketOrPort, this.host)

        this.socket.setKeepAlive(true, 15000)

        this.socket.on('end', (): void => this.emit('end'))
        this.socket.on('error', (err: any): void => this.emit('error', err))
        this.socket.on('close', (): void => {
            this.emit('disconnect')
            this.reconnect()
        })
        this.socket.on('timeout', (): void => {
            this.emit('timeout')
            this.reconnect()
        })

        this.socket.on('connect', (): void => this.connect())

        let buffer: String = ''

        this.socket.on('data', (data: any): void => {
            let next: number
            let prev: number = 0

            data = data.toString('utf8')

            while ((next = data.indexOf('\n', prev)) > -1) {
                buffer += data.substring(prev, next)
                this.emit('message', buffer)
                buffer = ''
                prev = next + 1
            }
            buffer += data.substring(prev)
        })
    }

    connect(): void {
        this.emit('connect')
        if (this.backlog.length) {
            const array: any[] = Array.prototype.slice.call(this.backlog)
            this.backlog = []
            for (let i: number = 0, len: number = array.length; len > i; i++) this.socket.write(array[i])
        }
    }

    send(data: any): any {
        if (this.socket.writable) {
            return this.socket.write(data + '\n')
        }
        this.backlog.push(data + '\n')
    }

    reconnect(): void {
        if (this.isSocket) return
        setTimeout(() => this.create(), 5)
    }
}