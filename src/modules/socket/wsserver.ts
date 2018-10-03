import { Channel } from '../pubsub/channel';
import { EventEmitter } from '../../utils/emitter';
import { BrokerClient } from '../broker/client';
import { Message, Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public channels: { [key: string]: Channel } = {};
  public middleware: { [key: string]: Listener } = {};

  private brokers: BrokerClient[] = [];
  private nextBrokerId: number = 0;

  constructor(private options: Options, internalSecurityKey: string) {
    super();

    // create connections to the brokers (still need to work on broker part)
    for (let i: number = 0; i < this.options.brokers; i++) {
      const brokerConnection: BrokerClient = new BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[i]}/?token=${internalSecurityKey}`);
      // need to fix this
      brokerConnection.onMessage((message: string | Buffer) => {
        console.log(Buffer.from(message as Buffer).toString());
      });
      this.brokers.push(brokerConnection);
    }

    this.flushLoop();
  }

  // need to add types for set middleware
  public setMiddleware(name: string, listener: Listener): void {
    this.middleware[name] = listener;
  }

  public publish(channelName: string, message: Message, id?: string): void {
    if (this.channels[channelName]) {
      this.channels[channelName].publish(id, message);
    }
  }

  public subscribe(channelName: string, id: string, listener: Listener): void {
    if (!this.channels[channelName]) {
      const channel: Channel = new Channel(channelName, id, listener);

      channel.on('publish', (chName: string, data: Message[]) => {
        // need to work on this function a bit :)
        let attempts: number = 0;
        let isCompleted: boolean = false;

        const message: Buffer = Buffer.from(`${channelName}%${JSON.stringify(data)}`);
        const brokersLength: number = this.brokers.length;

        while (!isCompleted && attempts < brokersLength * 2) {
          if (this.nextBrokerId >= brokersLength) {
            this.nextBrokerId = 0;
          }

          isCompleted = this.brokers[this.nextBrokerId].send(message);

          attempts++;
          this.nextBrokerId++;
        }
      });

      channel.on('destroy', (chName: string) => {
        delete this.channels[chName];
      });

      this.channels[channelName] = channel;

      // inform all brokers about new subscription
      // need to work out how subscription will work
      for (let i: number = 0, len: number = this.brokers.length; i < len; i++) {
        this.brokers[i].send(channelName);
      }
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

  private flushLoop(): void {
    setTimeout(() => {
      for (const channel in this.channels) {
        if (this.channels[channel]) {
          this.channels[channel].batchFlush();
        }
      }
      this.flushLoop();
    }, 10);
  }
}