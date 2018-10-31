import { Worker } from '../worker';
import { WebSocket } from '@clusterws/uws';
import { EventEmitter } from '../../utils/emitter';
import { logError, generateKey } from '../../utils/functions';
import { Listener, Message, Options } from '../../utils/types';

type PrivateSocket = {
  id: string,
  worker: Worker,
  emitter: EventEmitter,
  channels: { [key: string]: number }
};

export class Socket {
  public id: string = generateKey(8);
  private emitter: EventEmitter = new EventEmitter();
  private channels: { [key: string]: number } = {};

  constructor(private worker: Worker, private socket: WebSocket) {
    this.worker.wss.pubSub.register(this.id, (message: Message) => {
      this.send(null, message, 'publish');
    });

    this.socket.on('message', (message: string | Buffer): void => {
      try {
        // need to verify if it can parse Buffer from c++
        // handle binary data
        decode(this as any, JSON.stringify(message), this.worker.options);
      } catch (err) { logError(err); }
    });

    this.socket.on('close', (code?: number, reason?: string): void => {
      this.worker.wss.pubSub.deRegister(this.id, Object.keys(this.channels));
      this.emitter.emit('disconnect', code, reason);
      this.emitter.removeEvents();
    });

    this.socket.on('error', (err: Error): void => {
      if (!this.emitter.exist('error')) {
        logError(err);
        return this.socket.terminate();
      }
      this.emitter.emit('error', err);
    });
  }

  public on(event: string, listener: Listener): void {
    this.emitter.on(event, listener);
  }

  public send(event: string, message: Message, eventType: string = 'emit'): void {
    this.socket.send(encode(event, message, eventType, this.worker.options));
  }

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  public terminate(): void {
    this.socket.terminate();
  }
}

function encode(event: string, data: Message, eventType: string, option: Options): string | Buffer {
  // encode only data provided by user
  if (eventType === 'system' && option.encodeDecodeEngine) {
    data = option.encodeDecodeEngine.encode(data);
  }

  const message: { [key: string]: any } = {
    emit: ['e', event, data],
    publish: ['p', event, data],
    system: {
      configuration: ['s', 'c', data]
    }
  };

  const readyMessage: string = JSON.stringify(message[eventType][event] || message[eventType]);
  return option.useBinary ? Buffer.from(readyMessage) : readyMessage;
}

// decode message protocol && call socket functions
function decode(socket: PrivateSocket, data: Message, option: Options): void {
  // parse data with user provided decode function
  let [msgType, param, message]: [string, string, Message] = data;

  if (msgType !== 's' && option.encodeDecodeEngine) {
    message = option.encodeDecodeEngine.decode(message);
  }

  switch (msgType) {
    case 'e':
      return socket.emitter.emit(param, message);
    case 'p':
      return socket.channels[param] && socket.worker.wss.publish(param, message, socket.id);
    case 's':
      const channel: number = socket.channels[message];
      if (param === 's' && !channel) {
        socket.channels[message] = 1;
        socket.worker.wss.subscribe(message, socket.id);
      }
      if (param === 'u' && channel) {
        delete socket.channels[message];
        socket.worker.wss.unsubscribe(message, socket.id);
      }
      break;
  }
}