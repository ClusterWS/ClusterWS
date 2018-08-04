import { Worker } from '../worker';
import { UWebSocket } from '../uws/client';
import { EventEmitterSingle } from '../emitter/single';
import { logError, generateKey, keysOf } from '../../utils/functions';
import { CustomObject, Listener, Message } from '../../utils/types';

export class Socket {
  public id: string = generateKey(10);
  private events: EventEmitterSingle = new EventEmitterSingle();
  private channels: CustomObject = {};
  private onPublishEvent: (...args: any[]) => void;

  constructor(public worker: Worker, public socket: UWebSocket) {
    const initMessage: CustomObject = { ping: this.worker.options.pingInterval, binary: this.worker.options.useBinary };
    this.send('configuration', initMessage, 'system');
    this.onPublishEvent = (channel: string, message: Message): void => this.send(channel, message, 'publish');

    // Binary processed in uws/server.ts file
    this.socket.on(
      'message',
      (message: Message): void => {
        try {
          this.decode(JSON.parse(message));
        } catch (e) {
          logError(`\n${e}\n`);
        }
      }
    );

    this.socket.on(
      'close',
      (code?: number, reason?: string): void => {
        for (let i: number = 0, keys: string[] = keysOf(this.channels), len: number = keys.length; i < len; i++)
          this.worker.wss.channels.unsubscribe(keys[i], this.id);
        this.events.emit('disconnect', code, reason);
        this.events.removeEvents();
      }
    );

    this.socket.on('error', (err: Error): void => this.events.emit('error', err));
  }

  public on(event: 'error', listener: (err: Error) => void): void;
  public on(event: 'disconnect', listener: (code?: number, reason?: string) => void): void;
  public on(event: string, listener: Listener): void;
  public on(event: string, listener: Listener): void {
    this.events.on(event, listener);
  }

  public send(event: string, message: Message, eventType?: string): void;
  public send(event: string, message: Message, eventType: string = 'emit'): void {
    message = this.worker.options.encodeDecodeEngine ? this.worker.options.encodeDecodeEngine.encode(message) : message;
    message = this.encode(event, message, eventType);
    this.socket.send(this.worker.options.useBinary ? Buffer.from(message) : message);
  }

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  public terminate(): void {
    this.socket.terminate();
  }

  private encode(event: string, data: Message, eventType: string): string {
    const message: CustomObject = {
      emit: ['e', event, data],
      publish: ['p', event, data],
      system: {
        configuration: ['s', 'c', data]
      }
    };
    return JSON.stringify({ '#': message[eventType][event] || message[eventType] });
  }

  private decode(message: Message): void {
    const userMessage: Message = this.worker.options.encodeDecodeEngine
      ? this.worker.options.encodeDecodeEngine.decode(message['#'][2])
      : message['#'][2];

    const actions: CustomObject = {
      e: (): void => this.events.emit(message['#'][1], userMessage),
      p: (): void => this.channels[message['#'][1]] && this.worker.wss.publish(message['#'][1], userMessage),
      s: {
        s: (): void => {
          if (this.channels[userMessage]) return;
          const subscribe: Listener = (): void => {
            this.channels[userMessage] = 1;
            this.worker.wss.channels.subscribe(userMessage, this.onPublishEvent, this.id);
          };
          this.worker.wss.middleware.onSubscribe
            ? this.worker.wss.middleware.onSubscribe(this, userMessage, (allow: boolean): void => allow && subscribe())
            : subscribe();
        },
        u: (): void => {
          if (!this.channels[userMessage]) return;
          this.worker.wss.channels.unsubscribe(userMessage, this.id);
          this.worker.wss.middleware.onUnsubscribe && this.worker.wss.middleware.onUnsubscribe(this, userMessage);
          this.channels[userMessage] = null;
        }
      }
    };

    actions[message['#'][0]][message['#'][1]]
      ? actions[message['#'][0]][message['#'][1]]()
      : actions[message['#'][0]] && actions[message['#'][0]]();
  }
}
