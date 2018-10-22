import { random } from '../../utils/functions';
import { PubSubEngine } from '../pubsub/pubsub';
import { EventEmitter } from '../../utils/emitter';
import { BrokerClient } from '../broker/client';
import { Message, Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public pubSub: PubSubEngine = new PubSubEngine(10);
  public middleware: { [key: string]: Listener } = {};

  private brokers: BrokerClient[] = [];
  private nextBrokerId: number;

  constructor(private options: Options, internalSecurityKey: string) {
    super();
    this.nextBrokerId = random(0, this.options.brokers - 1);
    // need to add auto channel resubscribe on reconnect event
    for (let i: number = 0; i < this.options.brokers; i++) {
      const brokerClient: BrokerClient = new BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[i]}/?token=${internalSecurityKey}`);
      brokerClient.on('message', this.onBrokerMessage.bind(this));
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
    // need to inform brokers about new subscribed channel and unsubscribed
  }

  public unsubscribe(channelName: string, id: string): void {
    this.unsubscribe(channelName, id);
  }

  private onBrokerMessage(message: string | Buffer): void {
    // work out this part a bit more
    // message = Buffer.from(message as Buffer);
    // const index: number = message.indexOf(37);
    // const channel: string = message.slice(0, index).toString();

    // if (this.channels[channel]) {
    //   const actualMessage: Message[] = [];
    //   const parsedMessage: Message = JSON.parse(message.slice(index + 1, message.length) as any);
    //   for (let i: number = 0, len: number = parsedMessage.length; i < len; i++) {
    //     Array.prototype.push.apply(actualMessage, JSON.parse(Buffer.from(parsedMessage[i]) as any));
    //   }

    // this.channels[channel].publish('from_broker', actualMessage);
    // }
  }
}