import { Socket } from '../socket'

export function encode(event: string, data: any, type: string): any {
    switch (type) {
        case 'ping': return event
        case 'emit': return JSON.stringify({ '#': ['e', event, data] })
        case 'publish': return JSON.stringify({ '#': ['p', event, data] })
        case 'system':
            switch (event) {
                case 'subsribe': return JSON.stringify({ '#': ['s', 's', data] })
                case 'unsubscribe': return JSON.stringify({ '#': ['s', 'u', data] })
                case 'configuration': return JSON.stringify({ '#': ['s', 'c', data] })
                default: break
            }
        default: break
    }
}

export function decode(socket: Socket, message: any): any {
    switch (message['#'][0]) {
        case 'e': return socket.events.emit(message['#'][1], message['#'][2])
        case 'p': return socket.channels[message['#'][1]] && socket.worker.wss.publish(message['#'][1], message['#'][2])
        case 's':
            switch (message['#'][1]) {
                case 's':
                    const subscribe: any = (): number => socket.channels[message['#'][2]] = 1
                    return !socket.worker.wss.middleware.onsubscribe ? subscribe() :
                        socket.worker.wss.middleware.onsubscribe(socket, message['#'][2], (allow: boolean): void => allow && subscribe())
                case 'u': return socket.channels[message['#'][2]] = null
                default: break
            }
        default: break
    }
}