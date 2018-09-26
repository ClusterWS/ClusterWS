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

  public removeEvent(event: string): void {
    delete this.events[event];
  }

  public removeEvents(): void {
    this.events = {};
  }
}

// We may not need event emitter many any more as we use Room for pub sub
// export class EventEmitterMany {
//   private events: { [key: string]: [{ token: string, listener: ListenerMany }] } = {};

//   public on(event: string, listener: ListenerMany, token: string): void {
//     if (!isFunction(listener)) {
//       return logError('Listener must be a function');
//     }

//     if (this.events[event]) {
//       this.events[event].push({ token, listener });
//     } else {
//       this.events[event] = [{ token, listener }];
//       // this.action('create', event);
//     }
//   }

//   public emit(event: string, ...args: any[]): void {
//     const listeners: [{ token: string, listener: ListenerMany }] = this.events[event];
//     if (listeners) {
//       for (let i: number = 0, len: number = listeners.length; i < len; i++) {
//         listeners[i].listener(event, ...args);
//       }
//     }
//   }

//   public removeByListener(event: string, listener: Listener): void {
//     const listeners: [{ token: string, listener: ListenerMany }] = this.events[event];
//     if (listeners) {
//       for (let i: number = 0, len: number = listeners.length; i < len; i++) {
//         if (listeners[i].listener === listener) {
//           listeners.splice(i, 1);
//           break;
//         }
//       }

//       if (!listeners.length) {
//         delete this.events[event];
//         // this.action('destroy', event);
//       }
//     }
//   }

//   public removeByToken(event: string, token: string): void {
//     const listeners: [{ token: string, listener: ListenerMany }] = this.events[event];
//     if (listeners) {
//       for (let i: number = 0, len: number = listeners.length; i < len; i++) {
//         if (listeners[i].token === token) {
//           listeners.splice(i, 1);
//           break;
//         }
//       }

//       if (!listeners.length) {
//         delete this.events[event];
//         // this.action('destroy', event);
//       }
//     }
//   }

//   public exist(event: string): boolean {
//     return !!this.events[event];
//   }

//   // public action(action: string, event: string): void { /** Should be overwritten by user */ }
// }