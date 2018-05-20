import { logError, isFunction } from '../../utils/functions';
import { Listener, CustomObject, Message } from '../../utils/types';

// Note that listener's first arg is event name
export class EventEmitterMany {
  private events: CustomObject = {};

  public onMany(event: string, listener: (event: string, ...args: any[]) => void): void {
    if (!isFunction(listener)) return logError('Listener must be a function');
    if (this.events[event]) {
      this.events[event].push(listener);
    } else {
      this.events[event] = [listener];
      this.informBrokerSubscribe(event);
    }
  }

  public emitMany(event: string, ...args: any[]): void {
    const listeners: Listener[] = this.events[event];
    if (!listeners) return;
    for (let i: number = 0, len: number = listeners.length; i < len; i++) listeners[i](event, ...args);
  }

  public removeListener(event: string, listener: Listener): any {
    const listeners: Listener[] = this.events[event];
    if (!listeners) return;
    for (let i: number = 0, len: number = listeners.length; i < len; i++)
      if (listeners[i] === listener) return listeners.splice(i, 1);
    if (listeners.length === 0) {
      this.events[event] = null;
      this.informBrokerUnsubscribe(event);
    }
  }

  public exist(event: string): boolean {
    return this.events[event] && this.events[event].length > 0;
  }

  // Must be here to echange this functions in wsserver
  public informBrokerUnsubscribe(event: string): void {}
  public informBrokerSubscribe(event: string): void {}
}
