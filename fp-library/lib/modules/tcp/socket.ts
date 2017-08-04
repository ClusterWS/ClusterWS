import * as _ from '../../../utils/fp'
import { log } from '../../../utils/common'
import { Socket, connect } from 'net'
import { eventEmitter } from '../events/eventemitter'

export function tcpSocket(portOrSocket: any, host?: string) {
    let globalSocket: Socket
    let baffer: string = ''

    let on = _.curry((type: any, fn: any, socket: any) => {
        socket.on(type, fn)
        return socket
    })

    let isSocket = (socket: any) => socket instanceof Socket ? socket : connect(socket, host)

    let onConnect = () => log('Connected')

    let onData = (data: any) => {
        let str = data.toString()
        let i: number = str.indexOf('\n')
        if (i === -1) return baffer += str

        // TODO: Write emit statment

        let next = i + 1
        while ((i = data.indexOf('\n', next)) !== -1) {
            //  TODO write emit statment
            next = i + 1
        }
        baffer = str.slice(next)
    }

    let onError = (err: any) => { }

    let onEnd = () => globalSocket.emit('')

    globalSocket = _.compose(on('error', onError), on('end', onEnd), on('data', onData), on('connect', connect), isSocket)(portOrSocket)

    return globalSocket
}



// let str = data.toString();
//             let i: number = str.indexOf('\n');
//             if (i === -1) {
//                 this.dataBuffer += str;
//                 return;
//             }
//             this.emit('message', this.dataBuffer + str.slice(0, i));
//             let nextPart = i + 1;
//             while ((i = data.indexOf('\n', nextPart)) !== -1) {
//                 this.emit('message', str.slice(nextPart, i));
//                 nextPart = i + 1;
//             }
//             this.dataBuffer = str.slice(nextPart);