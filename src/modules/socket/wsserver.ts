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
    // need to add auto channel resubscribe on reconnect
    for (let i: number = 0; i < this.options.brokers; i++) {
      const brokerClient: BrokerClient = new BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[i]}/?token=${internalSecurityKey}`);
      brokerClient.on('message', this.onBrokerMessage.bind(this));
      this.brokers.push(brokerClient);
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
      let channel: Channel = new Channel(channelName, id, listener);

      channel.on('publish', (chName: string, data: Message[]) => {
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
        channel = null;
        for (let i: number = 0, len: number = this.brokers.length; i < len; i++) {
          this.brokers[i].send(JSON.stringify(['u', chName]));
        }
      });

      this.channels[channelName] = channel;

      for (let i: number = 0, len: number = this.brokers.length; i < len; i++) {
        this.brokers[i].send(JSON.stringify(['s', channelName]));
      }
    } else {
      this.channels[channelName].subscribe(id, listener);
    }
  }

  public unsubscribe(channelName: string, id: string): void {
    this.channels[channelName].unsubscribe(id);
  }

  private onBrokerMessage(message: string | Buffer): void {
    // work out this part a bit more
    message = Buffer.from(message as Buffer);
    const index: number = message.indexOf(37);
    const channel: string = message.slice(0, index).toString();

    if (this.channels[channel]) {
      let actualMessage: Message[] = [];
      const parsedMessage: Message = JSON.parse(message.slice(index + 1, message.length) as any);
      for (let i: number = 0, len: number = parsedMessage.length; i < len; i++) {
        actualMessage = actualMessage.concat(JSON.parse(Buffer.from(parsedMessage[i]) as any));
      }

      this.channels[channel].forcePublish(actualMessage);
    }
  }

  private flushLoop(): void {
    setTimeout(() => {
      for (const channel in this.channels) {
        if (this.channels[channel]) {
          this.channels[channel].batchFlush();
        }
      }
      this.flushLoop();
    }, 10000);
  }
}