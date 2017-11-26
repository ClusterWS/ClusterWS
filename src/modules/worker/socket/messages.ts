import { Socket } from './socket'

export function socketEncodeMessages(event: string, data: any, type: string): any {
    switch (type) {
        case 'ping': return event
        case 'emit': return JSON.stringify({ '#': ['e', event, data] })
        case 'publish': return JSON.stringify({ '#': ['p', event, data] })
        case 'system': switch (event) {
            case 'subsribe': return JSON.stringify({ '#': ['s', 's', data] })
            case 'unsubscribe': return JSON.stringify({ '#': ['s', 'u', data] })
            case 'configuration': return JSON.stringify({ '#': ['s', 'c', data] })
            default: break
        }
        default: break
    }
}

export function socketDecodeMessages(socket: Socket, message: any): any {
    switch (message['#'][0]) {
        case 'e': return socket.events.emit(message['#'][1], message['#'][2])
        case 'p': return socket.channels.indexOf(message['#'][1]) !== -1 ? socket.server.socketServer.publish(message['#'][1], message['#'][2]) : ''
        case 's': switch (message['#'][1]) {
            case 's':
                const subscribe: any = (): any => socket.channels.indexOf(message['#'][2]) === -1 ? socket.channels.push(message['#'][2]) : ''
                if (!socket.server.socketServer.middleware.onSubscribe) return subscribe()
                return socket.server.socketServer.middleware.onSubscribe(socket, message['#'][2], (decline: any): any => decline ? '' : subscribe())
            case 'u':
                const index: number = socket.channels.indexOf(message['#'][2])
                if (index !== -1) return socket.channels.splice(index, 1)
                break
            default: break
        }
        default: break
    }
}