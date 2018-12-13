import { Socket } from '../modules/socket/socket';
import { logError, isFunction } from './functions';
import { Listener, Message } from './types';

export class EventEmitter {
  private events: { [key: string]: Listener } = {};

  public on(event: 'connection', listener: (socket: Socket) => void): void;
  public on(event: string, listener: Listener): void;
  public on(event: string, listener: Listener): void {
    if (!isFunction(listener)) {
      return logError('Listener must be a function');
    }

    this.events[event] = listener;
  }

  public emit(event: string, message: Message): void;
  public emit(event: string, ...args: any[]): void;
  public emit(event: string, ...args: any[]): void {
    const listener: Listener = this.events[event];
    listener && listener(...args);
  }

  public exist(event: string): boolean {
    return !!this.events[event];
  }

  public off(event: string): void {
    delete this.events[event];
  }

  public removeEvents(): void {
    this.events = {};
  }
}