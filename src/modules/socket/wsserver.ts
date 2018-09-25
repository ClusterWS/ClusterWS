import { Channel } from '../pubsub/channel';
import { EventEmitter } from '../../utils/emitter';
import { Message, Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public channels: { [key: string]: Channel } = {};
  public middleware: { [key: string]: Listener } = {};

  constructor(private options: Options) {
    super();
    // create connections to the brokers (still need to work on broker part)

    this.channelsLoop();
  }

  // need to add types for set middeware
  public setMiddleware(name: string, listener: Listener): void {
    this.middleware[name] = listener;
  }

  public publish(channelName: string, message: Message, id?: string): void {
    // this should send to the clients and broker from inside of publish event (need to think)
    if (this.channels[channelName]) {
      this.channels[channelName].publish(id, message);
    }
  }

  public subscribe(channelName: string, id: string, listener: Listener): void {
    if (!this.channels[channelName]) {
      const channel: Channel = new Channel(channelName, id, listener);
      // this line will pass destroy function in to the channel component
      // need to test if destroy channel will work
      channel.action = this.removeChannel;
      this.channels[channelName] = channel;
    } else {
      this.channels[channelName].subscribe(id, listener);
    }
  }

  public unsubscribe(channelName: string, id: string): void {
    this.channels[channelName].unsubscribe(id);
  }

  // need to work on this part
  private broadcastMessage(): void {
    // this function should send message to the clients only
    // need to extract channel check if it exists and then publish with unfilteredFlush Channel
  }

  // this function is called from inside of channel component check actions
  private removeChannel(event: string, channelName: string): void {
    delete this.channels[channelName];
  }

  private channelsLoop(): void {
    setTimeout(() => {
      // think if we should have different timeouts for each of them
      for (const channel in this.channels) {
        if (this.channels[channel]) {
          this.channels[channel].flush();
        }
      }
      this.channelsLoop();
    }, 10);
  }
}