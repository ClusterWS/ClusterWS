import { Room } from '../pubsub/room';
import { EventEmitter } from '../../utils/emitter';
import { Message, Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public channels: { [key: string]: Room } = {};
  public middleware: { [key: string]: Listener } = {};

  constructor(private options: Options) {
    super();
    // create connections to the brokers (still need to work on broker part)

    this.flushLoop();
  }

  public setMiddleware(name: string, listener: Listener): void {
    this.middleware[name] = listener;
  }

  public publish(channel: string, message: Message, id?: string): void {
    // this should send to the clients and broker from inside of publish event (need to think)
    if (this.channels[channel]) {
      this.channels[channel].publish(id, message);
    }
  }

  public subscribe(channel: string, id: string, listener: Listener): void {
    if (!this.channels[channel]) {
      const room: Room = new Room(channel, id, listener);
      room.action = this.removeCannel;
      this.channels[channel] = room;
    } else {
      this.channels[channel].subscribe(id, listener);
    }
  }

  // need to work on this part
  private broadcastMessage(): void {
    // this function shou,d send message to the clients only
    // need to extract channel check if it exists and then publish with unfilteredFlush Room
  }

  private removeCannel(channel: string): void {
    delete this.channels[channel];
  }

  private flushLoop(): void {
    setTimeout(() => {
      // loop through each channel and call flush
      this.flushLoop();
    }, 10);
  }
}