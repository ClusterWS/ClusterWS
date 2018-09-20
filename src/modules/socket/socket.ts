import { Worker } from '../worker';
import { WebSocket } from 'clusterws-uws';
import { EventEmitter } from '../../utils/emitter';
import { Listener, Message } from '../../utils/types';

export class Socket {
  private emitter: EventEmitter = new EventEmitter();
  private channels: { [key: string]: number } = {};

  constructor(private worker: Worker, private socket: WebSocket) {
    this.socket.on('message', (message: string | Buffer): void => {
      // menage message
    });

    this.socket.on('close', (code?: number, reason?: string): void => {
      // manage close channels
      this.emitter.emit('disconnect', code, reason);
      this.emitter.removeEvents();
    });

    this.socket.on('error', (err: Error) => {
      // manage error
      // if (!this.emitter.exist('error')) {
      //   throw
      // }
      this.emitter.emit('error', err);
    });
  }

  public on(event: string, listener: Listener): void {
    this.emitter.on(event, listener);
  }

  public send(event: string, message: Message, eventType: string = 'emit'): void {
    // need to fix send event
    this.socket.send(encode(event, message, eventType, this.worker.options.useBinary));
  }

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  public terminate(): void {
    this.socket.terminate();
  }
}

function encode(event: string, data: Message, eventType: string, binary?: boolean): string | Buffer {
  const message: { [key: string]: any } = {
    emit: ['e', event, data],
    publish: ['p', event, data],
    system: {
      configuration: ['s', 'c', data]
    }
  };
  const dataString: string = JSON.stringify({ '#': message[eventType][event] || message[eventType] });
  return binary ? Buffer.from(dataString) : dataString;
}

function decode(data: string | Buffer): Message {
  // implement deode
}