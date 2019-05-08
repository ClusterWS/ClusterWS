import { Socket } from './socket';
import { Message } from '../../utils/types';

// encode message to ClusterWS protocol
export function encode(event: string, data: Message, eventType: string): string | Buffer {
  const message: { [key: string]: any } = {
    emit: ['e', event, data],
    publish: ['p', event, data],
    system: {
      subscribe: ['s', 's', data],
      configuration: ['s', 'c', data]
    }
  };

  if (eventType === 'system') {
    return JSON.stringify(message[eventType][event]);
  }
  return JSON.stringify(message[eventType]);
}

// decode message from ClusterWS protocol
export function decode(socket: Socket, data: Message): void {
  // parse data with user provided decode function
  const [msgType, param, message]: [string, string, Message] = data;

  // 'e' means emit
  if (msgType === 'e') {
    return (socket as any).emitter.emit(param, message);
  }

  // 'p' means publish
  if (msgType === 'p') {
    return (socket as any).channels[param] && (socket as any).worker.wss.publish(param, message, (socket as any).id);
  }

  // if we start with 's' it means system
  if (msgType === 's') {
    // second 's' means subscribe
    if (param === 's') {
      // we always expect to get array of channels
      return socket.subscribe(message);
    }

    // 'u' means unsubscribe
    if (param === 'u') {
      return socket.unsubscribe(message);
    }
  }
}