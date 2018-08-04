import { CustomObject } from '../../utils/types';
import { logError, isFunction } from '../../utils/functions';

export class EventEmitterMany {
  public events: CustomObject = {};

  public subscribe(event: string, listener: (event: string, ...args: any[]) => void, token: string): void {
    if (!isFunction(listener)) return logError('Listener must be a function');
    if (this.events[event]) {
      this.events[event].push({ token, listener });
    } else {
      this.events[event] = [{ token, listener }];
      this.changeChannelStatusInBroker(event, 'create');
    }
  }

  public publish(event: string, ...args: any[]): void {
    const listeners: CustomObject[] = this.events[event];
    if (!listeners) return;
    // Note that listener's first arg is event name always
    for (let i: number = 0, len: number = listeners.length; i < len; i++) listeners[i].listener(event, ...args);
  }

  public unsubscribe(event: string, token: string): void {
    const listeners: CustomObject[] = this.events[event];
    if (!listeners) return;

    for (let i: number = 0, len: number = listeners.length; i < len; i++)
      if (listeners[i].token === token) {
        listeners.splice(i, 1);
        break;
      }

    if (listeners.length === 0) {
      this.events[event] = null;
      this.changeChannelStatusInBroker(event, 'destory');
    }
  }

  public exist(event: string): boolean {
    return this.events[event];
  }

  public changeChannelStatusInBroker(event: string, eventType: string): void {
    return;
  }
}
