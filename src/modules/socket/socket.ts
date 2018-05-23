// TODO: Need clean up

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

    this.socket.on('message', (message: Message): void => {
      try {
        decode(this, JSON.parse(message));
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
      // Have removed cleaning up for now (need to test memory test)
    });
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
    message = encode(event, message, eventType);
    this.socket.send(this.worker.options.useBinary ? Buffer.from(message) : message);
  }

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  public terminate(): void {
    this.socket.terminate();
  }
}
