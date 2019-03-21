import { Worker } from '../worker';
import { WebSocket } from '@clusterws/cws';
import { generateUid } from '../../utils/helpers';
import { EventEmitter } from '../../utils/emitter';
import { Message, Listener } from '../../utils/types';

type PrivateSocket = {
  id: string,
  worker: Worker,
  emitter: EventEmitter,
  channels: { [key: string]: boolean }
};

export class Socket {
  private id: string = generateUid(8);
  private emitter: EventEmitter;
  private channels: { [key: string]: boolean } = {};

  constructor(private worker: Worker, private socket: WebSocket) {
    this.emitter = new EventEmitter(this.worker.options.logger);

    // any type is to overcome private type
    (this.worker.wss as any).pubSub.register(this.id, (message: Message) => {
      // we dont have to pass event as publish messages is large object with structure { channel: [data] }
      this.send(null, message, 'publish');
    });

    this.socket.on('message', (message: string | Buffer): void => {
      // if user listens on 'message' event then we will not parse any messages
      // and just emit default websocket on message event
      if (this.emitter.exist('message')) {
        return this.emitter.emit('message', message);
      }

      // Try catch is very slow when we throw error therefore we need to try and handle as much as possible error in try method
      try {
        // make sure that incoming message is at least looking like correct structure
        if (message[0] !== 91 && message[0] !== '[') {
          // if it is not starting with "[" we can 100% that it is wrong structure
          if (this.emitter.exist('error')) {
            return this.emitter.emit('error', new Error('Received message is not correct structure'));
          }

          this.worker.options.logger.error('Received message is not correct structure');
          return this.terminate();
        }

        // we can try and decode message
        // JSON.parse() is actually another slow part :(
        // unfortunately we can not do anything about that
        decode(this as any, JSON.parse(message.toString() as any));
      } catch (err) {
        // we have caught some error trying to parse message try and send message to standard websocket output
        // for user to process or to error output
        if (this.emitter.exist('error')) {
          return this.emitter.emit('error', err);
        }
        this.worker.options.logger.error(err);
        this.terminate();
      }
    });

    this.socket.on('close', (code?: number, reason?: string): void => {
      // TODO: add unregister event from channels
      this.emitter.emit('disconnect', code, reason);
      this.emitter.removeEvents();
    });

    this.socket.on('error', (err: Error): void => {
      if (this.emitter.exist('error')) {
        // user can decide what to do with this error
        return this.emitter.emit('error', err);
      }
      this.worker.options.logger.error(err);
      this.socket.terminate();
    });
  }

  public on(event: string, listener: Listener): void {
    this.emitter.on(event, listener);
  }

  public send(event: string, message: Message, eventType: string = 'emit'): void {
    this.socket.send(encode(event, message, eventType));
  }

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  public terminate(): void {
    this.socket.terminate();
  }
}

function encode(event: string, data: Message, eventType: string): string | Buffer {
  const message: { [key: string]: any } = {
    emit: ['e', event, data],
    publish: ['p', event, data],
    system: {
      configuration: ['s', 'c', data]
    }
  };

  return JSON.stringify(message[eventType][event] || message[eventType]);
}

function decode(socket: PrivateSocket, data: Message): void {
  // parse data with user provided decode function
  const [msgType, param, message]: [string, string, Message] = data;

  // 'e' means emit
  if (msgType === 'e') {
    return socket.emitter.emit(param, message);
  }

  // 'p' means publish
  if (msgType === 'p') {
    return socket.channels[param] && socket.worker.wss.publish(param, message, socket.id);
  }

  // if we start with 's' it means system
  if (msgType === 's') {
    // second 's' means subscribe
    if (param === 's') {
      socket.channels[message] = true;
      return socket.worker.wss.subscribe(socket.id, message);
    }

    // 'u' means unsubscribe
    if (param === 'u') {
      delete socket.channels[message];
      return socket.worker.wss.unsubscribe(socket.id, message);
    }
  }
}