import { Room } from '../pubsub/room';
import { EventEmitter } from '../../utils/emitter';
import { Message, Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public channels: { [key: string]: Room } = {};
  public middleware: { [key: string]: Listener } = {};

  constructor(private options: Options) {
    super();
    // create connections to the brokers (still need to work on broker part)

    this.roomLoop();
  }

  // need to add types for set middeware
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
      // this line will pass destroy function in to the room component
      room.action = this.removeChannel;
      this.channels[channel] = room;
    } else {
      this.channels[channel].subscribe(id, listener);
    }
  }

  public unsubscribe(channel: string, id: string): void {
    this.channels[channel].unsubscribe(id);
  }

  // need to work on this part
  private broadcastMessage(): void {
    // this function should send message to the clients only
    // need to extract channel check if it exists and then publish with unfilteredFlush Room
  }

  // this function is called from inside of room component check actions
  private removeChannel(event: string, channel: string): void {
    delete this.channels[channel];
  }

  private roomLoop(): void {
    setTimeout(() => {
      // think if we should have different timeouts for each of them
      for (const channel in this.channels) {
        if (this.channels[channel]) {
          this.channels[channel].flush();
        }
      }
      this.roomLoop();
    }, 10);
  }
}