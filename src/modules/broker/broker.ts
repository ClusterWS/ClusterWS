import * as WebSocket from 'uws'
import { IOptions, IProcessMessage } from '../utils/interfaces'
import { logError } from '../utils/logs'

export class Broker {
    // client(url: string): void {
    //     return
    // }

    public static server(options: IOptions, info: any): void {
        const sockets: any[] = []
        const server: WebSocket.Server = new WebSocket.Server({ port: options.brokerPort })

        server.on('connection', (socket: any) => {
            const timeout: any = setTimeout(() => socket.close(4000, 'Not Authenticated'), 5000)

            socket.on('message', (message: any) => {
                if (message === '#1') return
                if (message === info.internalKey) {
                    setUniqueId(socket)
                    return clearTimeout(timeout)
                }
            })

            socket.on('close', () => {
                if (socket.id)
                    for (let i: number = 0, len: number = sockets.length; i < len; i++)
                        if (sockets[i].id === socket.id) return sockets.splice(i, 1)
            })
        })

        server.on('error', (err: any) => logError('Broker' + process.pid + ' has an issue: ' + '\n' + err.stack + '\n'))

        function setUniqueId(socket: any): void | any {
            socket.id = Math.floor(100000 + Math.random() * 99999999)
            if (sockets.length === 0) return sockets.push(socket)
            for (let i: number = 0, len: number = sockets.length; i < len; i++) {
                if (sockets[i].id === socket.id) return setUniqueId(socket)
                if (i === len - 1) return sockets.push(socket)
            }
        }
    }
}