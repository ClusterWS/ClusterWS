import { _ } from '../../utils/fp'
import { EventEmitter } from '../../utils/eventemitter'
import { Socket, connect } from 'net';


export class TcpSocket extends EventEmitter {
    socket: Socket
    buffer: string = ''

    constructor(public port: any, host?: string) {
        super()

        port instanceof Socket ? this.socket = port : this.socket = connect(port, host)

        this.socket.on('connect', () => this.emit('connect'))
        this.socket.on('end', () => this.emit('disconnect'))
        this.socket.on('error', (err: any) => this.emit('error', err))

        this.socket.on('data', (data: any) => {
            let str: string = data.toString()
            let i: number = str.indexOf('\n')

            if (i === -1) return this.buffer += str

            this.emit('message', this.buffer + str.slice(0, i))
            let next = i + 1

            while ((i = str.indexOf('\n', next)) !== -1) {
                this.emit('message', str.slice(next, i))
                next = i + 1
            }
            this.buffer = str.slice(next)
        })
    }

    send(data: any) {
        this.socket.write(data + '\n')
    }
}

