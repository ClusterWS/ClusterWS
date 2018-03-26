import { Socket } from './socket'
import { CustomObject } from '../../utils/types'

export function encode(event: string, data: any, typeOfEvent: string): string {
  const message: CustomObject = {
    emit: { '#': ['e', event, data] },
    publish: { '#': ['p', event, data] },
    system: {
      subscribe: { '#': ['s', 's', data] },
      unsubscribe: { '#': ['s', 'u', data] },
      configuration: { '#': ['s', 'c', data] }
    }
  }
  return typeOfEvent === 'ping' ? event :
    JSON.stringify(typeOfEvent === 'system' ?
      message[typeOfEvent][event] : message[typeOfEvent])
}

export function decode(socket: Socket, message: any): void {
  const actions: CustomObject = {
    e: (): void => socket.events.emit(message['#'][1], message['#'][2]),
    p: (): void => socket.channels[message['#'][1]] && socket.worker.wss.publish(message['#'][1], message['#'][2]),
    s: {
      s: (): void => {
        const subscribe: any = (): void => {
          socket.channels[message['#'][2]] = 1
          socket.worker.wss.channels.onMany(message['#'][2], socket.onPublish)
        }
        !socket.worker.wss.middleware.onSubscribe ? subscribe() :
          socket.worker.wss.middleware.onSubscribe(socket, message['#'][2], (allow: boolean): void => allow && subscribe())
      },
      u: (): void => {
        socket.worker.wss.channels.removeListener(message['#'][2], socket.onPublish)
        socket.channels[message['#'][2]] = null
      }
    }
  }
  return message['#'][0] === 's' ?
    actions[message['#'][0]][message['#'][1]] && actions[message['#'][0]][message['#'][1]]() :
    actions[message['#'][0]] && actions[message['#'][0]]()
}