import { Worker } from '../worker';
import { WebSocket } from 'clusterws-uws';
import { EventEmitter } from '../../utils/emitter';
import { logError, generateKey } from '../../utils/functions';
import { Listener, Message, Options } from '../../utils/types';

export class Socket {
  public id: string = generateKey(10);
  private emitter: EventEmitter = new EventEmitter();
  private channels: { [key: string]: number } = {};
  private onPublish: Listener;

  constructor(private worker: Worker, private socket: WebSocket) {
    this.onPublish = (channel: string, message: Message): void => {
      this.send(channel, message, 'publish');
    };

    this.socket.on('message', (message: string | Buffer): void => {
      try {
        // need to verify if it can parse Buffer from c++
        decode(this, JSON.stringify(message), this.worker.options);
      } catch (err) { logError(err); }
    });

    this.socket.on('close', (code?: number, reason?: string): void => {
      for (const channle in this.channels) {
        if (this.channels[channle]) {
          this.worker.wss.unsubscribe(channle, this.id);
        }
      }

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
  // encode only data provied by user
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

  const readyMessage: string = JSON.stringify({ '#': message[eventType][event] || message[eventType] });
  return option.useBinary ? Buffer.from(readyMessage) : readyMessage;
}

// decode message protocall && call socket functions
function decode(socket: Socket, data: Message, option: Options): void {
  // parse data with user provided decode function
  let [msgType, param, message]: [string, string, Message] = data['#'];

  // data = data['#'];
  if (msgType !== 's' && option.encodeDecodeEngine) {
    message = option.encodeDecodeEngine.decode(message);
  }

  switch (msgType) {
    case 'e':
      // need to cast any to be able to use private param
      return (socket as any).emitter.emit(param, message);
    case 'p':
      // need to cast any to be able to use private param
      return (socket as any).channels[param] && (socket as any).worker.wss.publish(param, message, socket.id);
    case 's':
      const channel: number = (socket as any).channels[message];
      if (param === 's' && !channel) {
        (socket as any).channels[message] = 1;
        (socket as any).worker.wss.subscribe(message, socket.id, (socket as any).onPublish);
      }
      if (param === 'u' && channel) {
        delete (socket as any).channels[message];
        (socket as any).worker.wss.unsubscribe(message, socket.id);
      }
      break;
  }
}