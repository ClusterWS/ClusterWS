import { random } from '../../utils/functions';
import { PubSubEngine } from '../pubsub/pubsub';
import { EventEmitter } from '../../utils/emitter';
import { BrokerClient } from '../broker/client';
import { Message, Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public pubSub: PubSubEngine = new PubSubEngine(5);
  public middleware: { [key: string]: Listener } = {};

  private brokers: BrokerClient[] = [];
  private nextBrokerId: number = random(0, this.options.brokers - 1);

  constructor(private options: Options, internalSecurityKey: string) {
    super();

    this.pubSub.on('channelNew', (channelName: string) => {
      for (let i: number = 0, len: number = this.brokers.length; i < len; i++) {
        this.brokers[i].send(JSON.stringify(['s', channelName]));
      }
    });

    this.pubSub.on('channelRemove', (channelName: string) => {
      for (let i: number = 0, len: number = this.brokers.length; i < len; i++) {
        this.brokers[i].send(JSON.stringify(['u', channelName]));
      }
    });

    this.pubSub.register('broker', (message: Message): void => {
      let attempts: number = 0;
      let isCompleted: boolean = false;

      const readyMessage: Buffer = Buffer.from(JSON.stringify(message));
      const brokersLength: number = this.brokers.length;

      while (!isCompleted && attempts < brokersLength * 2) {
        if (this.nextBrokerId >= brokersLength) {
          this.nextBrokerId = 0;
        }

        isCompleted = this.brokers[this.nextBrokerId].send(readyMessage);

        attempts++;
        this.nextBrokerId++;
      }
    });

    const onBrokerMessage: Listener = this.onBrokerMessage.bind(this);
    for (let i: number = 0; i < this.options.brokers; i++) {
      const brokerClient: BrokerClient = new BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[i]}/?token=${internalSecurityKey}`);
      brokerClient.on('message', onBrokerMessage);
      brokerClient.on('connect', () => {
        const allChannels: string[] = this.pubSub.getAllChannels();
        if (allChannels.length) {
          brokerClient.send(JSON.stringify(['s', allChannels]));
        }
      });
      this.brokers.push(brokerClient);
    }
  }

  // need to add types for set middleware
  public setMiddleware(name: string, listener: Listener): void {
    this.middleware[name] = listener;
  }

  public publish(channelName: string, message: Message, id?: string): void {
    this.pubSub.publish(channelName, message, id);
  }

  public subscribe(channelName: string, id: string): void {
    this.pubSub.subscribe(channelName, id);
  }

  public unsubscribe(channelName: string, id: string): void {
    this.unsubscribe(channelName, id);
  }

  private onBrokerMessage(message: string | Buffer): void {
    // Can optimize this function by passing whole array to the pubsub engine
    const msg: Message = JSON.parse(Buffer.from(message as Buffer) as any);
    for (const key in msg) {
      if (msg[key]) {
        const allMessages: Message[] = msg[key];
        for (let i: number = 0, len: number = allMessages.length; i < len; i++) {
          this.publish(key, allMessages[i], 'broker');
        }
      }
    }
  }
}