import * as _ from '../../../utils/fp'
import { log } from '../../../utils/common'
import { eventEmitter } from '../events/eventemitter'
import { Socket, connect } from 'net'

export function tcpSocket(portOrSocket: any, host?: string) {
    let _socket: Socket;
    
    let baffer: string = ''
    let eventemitter = eventEmitter()

    let on = _.curry((type: any, fn: any, socket: any) => {
        socket.on(type, fn)
        return socket
    })
    let send = (data: any) => _socket.write(data + '\n')
    let isSocket = (socket: any, host?: string) => socket instanceof Socket ? _socket = socket : _socket = connect(socket, host)
    let onConnect = () => eventemitter.emit('connect')
    let onError = (err: any) => eventemitter.emit('error', err)
    let onEnd = () => eventemitter.emit('disconnect')
    let onData = (data: any) => {
        let str = data.toString()
        let i: number = str.indexOf('\n')

        if (i === -1) return baffer += str

        eventemitter.emit('message', baffer + str.slice(0, i));

        let next = i + 1
        while ((i = data.indexOf('\n', next)) !== -1) {
            eventemitter.emit('message', str.slice(next, i));
            next = i + 1
        }
        baffer = str.slice(next)
    }

    _.compose(on('error', onError), on('end', onEnd), on('data', onData), on('connect', connect), isSocket)(portOrSocket, host)

    return { on: eventemitter.on, send: send }
}