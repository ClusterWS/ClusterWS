import { EventEmitter } from '../../common/emitter'
import { Socket, connect } from 'net'

export class TcpSocket extends EventEmitter {
    socket: Socket
    buffer: string

    constructor(socketOrPort: any, host?: string) {
        super()

        socketOrPort instanceof Socket ? this.socket = socketOrPort : this.socket = connect(socketOrPort, host)

        this.socket.setKeepAlive(true, 20000)

        this.socket.on('end', (): void => this.emit('disconnect'))
        this.socket.on('error', (err: any): void => this.emit('error', err))
        this.socket.on('connect', (): void => this.emit('connect'))

        this.buffer = ''

        this.socket.on('data', (data: any): void => {
            let next: number
            let prev: number = 0

            data = data.toString('utf8')

            while ((next = data.indexOf('\n', prev)) > -1) {
                this.buffer += data.substring(prev, next)
                this.emit('message', this.buffer)
                this.buffer = ''
                prev = next + 1
            }
            this.buffer += data.substring(prev)
        })
    }

    send(data: any): void {
        this.socket.write(data + '\n')
    }
}