import { Socket } from './socket'
import { CustomObject, Message } from '../../utils/types'

export function encode(event: string, data: Message, eventType: string): string {
  const message: CustomObject = {
    emit: { '#': ['e', event, data] },
    publish: { '#': ['p', event, data] },
    system: {
      subscribe: { '#': ['s', 's', data] },
      unsubscribe: { '#': ['s', 'u', data] },
      configuration: { '#': ['s', 'c', data] }
    }
  }
  return JSON.stringify(eventType === 'system' ?
    message[eventType][event] : message[eventType])
}

export function decode(socket: Socket, message: Message): void {
  const userMessage: Message = socket.worker.options.encodeDecodeEngine ?
    socket.worker.options.encodeDecodeEngine.decode(message['#'][2]) : message['#'][2]

  const actions: CustomObject = {
    e: (): void => socket.events.emit(message['#'][1], userMessage),
    p: (): void => socket.channels[message['#'][1]] && socket.worker.wss.publish(message['#'][1], userMessage),
    s: {
      s: (): void => {
        const subscribe: any = (): void => {
          socket.channels[userMessage] = 1
          socket.worker.wss.channels.onMany(userMessage, socket.onPublishEvent)
        }
        !socket.worker.wss.middleware.onSubscribe ? subscribe() :
          socket.worker.wss.middleware.onSubscribe(socket, userMessage, (allow: boolean): void => allow && subscribe())
      },
      u: (): void => {
        socket.worker.wss.channels.removeListener(userMessage, socket.onPublishEvent)
        socket.channels[userMessage] = null
      }
    }
  }

  return message['#'][0] === 's' ?
    actions[message['#'][0]][message['#'][1]] && actions[message['#'][0]][message['#'][1]]() :
    actions[message['#'][0]] && actions[message['#'][0]]()
}