import { Worker } from '../worker';
import { logError } from '../../utils/functions';
import { WebSocket } from 'clusterws-uws';
import { EventEmitter } from '../../utils/emitter';
import { Listener, Message, Options } from '../../utils/types';

export class Socket {
  private emitter: EventEmitter = new EventEmitter();
  private channels: { [key: string]: number } = {};

  constructor(private worker: Worker, private socket: WebSocket) {
    this.socket.on('message', (message: string | Buffer): void => {
      try {
        // need to verify if it can parse Array Buffer
        decode(this, JSON.stringify(message), this.worker.options);
      } catch (err) { logError(err); }
    });

    this.socket.on('close', (code?: number, reason?: string): void => {
      // manage close channels
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

// decode message protocall and execute right call
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
      return (socket as any).channels[param] && null /** need to add emit function */;
    case 's':
      if (param === 's') {
        // add on subscribe
      }
      if (param === 'u') {
        // ass on unsubscribe
      }
  }
}