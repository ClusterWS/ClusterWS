import { Channel } from '../pubsub/channel';
import { EventEmitter } from '../../utils/emitter';
import { BrokerClient } from '../broker/client';
import { Message, Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public channels: { [key: string]: Channel } = {};
  public middleware: { [key: string]: Listener } = {};

  private brokers: BrokerClient[];
  private nextBrokerId: number = 0;

  constructor(private options: Options, internalSecurityKey: string) {
    super();

    // create connections to the brokers (still need to work on broker part)
    for (let i: number = 0; i < this.options.brokers; i++) {
      this.brokers.push(new BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[i]}/?token=${internalSecurityKey}`));
    }

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
      channel.action = this.actionsFromChannel;
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

  private actionsFromChannel(event: string, channelName: string, data?: Message[]): void {
    switch (event) {
      case 'destroy':
        delete this.channels[channelName];
        break;
      case 'publish':
        let attemps: number = 0;
        let isCompleted: boolean = false;

        const message: Buffer = Buffer.from(`${channelName}%${JSON.stringify(data)}`);
        const brokersLength: number = this.brokers.length;

        while (!isCompleted && attemps < brokersLength * 2) {
          if (this.nextBrokerId >= brokersLength) {
            this.nextBrokerId = 0;
          }

          isCompleted = this.brokers[this.nextBrokerId].publish(message);

          attemps++;
          this.nextBrokerId++;
        }

        break;
    }

  }

  private channelsLoop(): void {
    setTimeout(() => {
      for (const channel in this.channels) {
        if (this.channels[channel]) {
          this.channels[channel].flush();
        }
      }
      this.channelsLoop();
    }, 10); // need to think about the timeout (should it be 5) ?
  }
}