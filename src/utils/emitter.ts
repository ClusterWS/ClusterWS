import { logError, isFunction } from './functions';
import { Listener, Message, ListenerMany } from './types';

export class EventEmitter {
  private events: { [key: string]: Listener } = {};

  // public on(event: 'connection', listener: (socket: Socket) => void): void;
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

  public removeEvent(event: string): void {
    delete this.events[event];
  }

  public removeEvents(): void {
    this.events = {};
  }
}

export class EventEmitterMany {
  private events: { [key: string]: [{ token: string, listener: ListenerMany }] } = {};

  public on(event: string, listener: ListenerMany, token: string): void {
    if (!isFunction(listener)) {
      return logError('Listener must be a function');
    }

    if (this.events[event]) {
      this.events[event].push({ token, listener });
    } else {
      this.events[event] = [{ token, listener }];
      this.action('create', event);
    }
  }

  public emit(event: string, ...args: any[]): void {
    const listeners: [{ token: string, listener: ListenerMany }] = this.events[event];
    if (listeners) {
      for (let i: number = 0, len: number = listeners.length; i < len; i++) {
        listeners[i].listener(event, ...args);
      }
    }
  }

  public action(action: string, event: string): void { /** Should be overwritten by user */ }
}