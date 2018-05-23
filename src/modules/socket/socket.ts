import { Worker } from '../worker';
import { logError } from '../../utils/functions';
import { UWebSocket } from '../uws/client';
import { encode, decode } from './parser';
import { EventEmitterSingle } from '../emitter/single';
import { CustomObject, Listener, Message } from '../../utils/types';

export class Socket {
  public events: EventEmitterSingle = new EventEmitterSingle();
  public channels: CustomObject = {};
  public onPublishEvent: (...args: any[]) => void;

  constructor(public worker: Worker, public socket: UWebSocket) {
    this.onPublishEvent = (channel: string, message: Message): void => this.send(channel, message, 'publish');
    this.send(
      'configuration',
      { ping: this.worker.options.pingInterval, binary: this.worker.options.useBinary },
      'system'
    );

    this.socket.on('error', (err: Error): void => this.events.emit('error', err));
    this.socket.on('message', (message: Message): void => {
      try {
        message = JSON.parse(message);
        decode(this, message);
      } catch (e) {
        logError(`PID: ${process.pid}\n${e}\n`);
      }
    });
    this.socket.on('close', (code?: number, reason?: string): void => {
      for (
        let i: number = 0, keys: string[] = Object.keys(this.channels), keysLength: number = keys.length;
        i < keysLength;
        i++
      )
        this.worker.wss.channels.removeListener(keys[i], this.onPublishEvent);
      this.events.emit('disconnect', code, reason);
      // Have removed cleaning up for now  (need to test memory test)
    });
  }

  public on(event: 'error', listener: (err: Error) => void): void;
  public on(event: 'disconnect', listener: (code?: number, reason?: string) => void): void;
  public on(event: string, listener: Listener): void;
  public on(event: string, listener: Listener): void {
    this.events.on(event, listener);
  }

  public send(event: string, message: Message, eventType?: string): void;
  public send(event: string, message: Message, eventType: string = 'emit'): void {}

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  public terminate(): void {
    this.socket.terminate();
  }
}
