import { Socket } from './socket';
import { UWebSocket } from '../uws/client';
import { logWarning } from '../../utils/functions';
import { EventEmitterMany } from '../emitter/many';
import { EventEmitterSingle } from '../emitter/single';
import { CustomObject, Message, Listener } from '../../utils/types';

type InternalBrokers = {
  brokers: CustomObject;
  nextBroker: number;
  brokersKeys: string[];
  brokersAmount: number;
};

export class WSServer extends EventEmitterSingle {
  public channels: EventEmitterMany = new EventEmitterMany();
  public middleware: CustomObject = {};

  private internalBrokers: InternalBrokers = {
    brokers: {},
    nextBroker: -1,
    brokersKeys: [],
    brokersAmount: 0
  };

  constructor() {
    super();

    this.channels.changeChannelStatusInBroker = (event: string): void => {
      for (let i: number = 0; i < this.internalBrokers.brokersAmount; i++) {
        const receiver: UWebSocket = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[i]];
        if (receiver.readyState === 1) receiver.send(event);
      }
    };
  }

  public setMiddleware(name: 'onPublish', listener: (channel: string, message: Message) => void): void;
  public setMiddleware(name: 'onSubscribe', listener: (socket: Socket, channel: string, next: Listener) => void): void;
  public setMiddleware(name: 'verifyConnection', listener: (info: CustomObject, next: Listener) => void): void;
  public setMiddleware(name: 'onMessageFromWorker', listener: (message: Message) => void): void;
  public setMiddleware(name: string, listener: Listener): void {
    this.middleware[name] = listener;
  }

  public publishToWorkers(message: Message): void;
  public publishToWorkers(message: Message): void {
    this.publish('#sendToWorkers', message);
  }

  public publish(channel: string, message: Message, tries?: number): void;
  public publish(channel: string, message: Message, tries: number = 0): void | NodeJS.Timer {
    if (tries > this.internalBrokers.brokersAmount * 2 + 1) return logWarning('Does not have access to any broker');
    if (this.internalBrokers.brokersAmount <= 0) return setTimeout(() => this.publish(channel, message, ++tries), 10);

    this.internalBrokers.nextBroker >= this.internalBrokers.brokersAmount - 1
      ? (this.internalBrokers.nextBroker = 0)
      : this.internalBrokers.nextBroker++;

    const receiver: CustomObject = this.internalBrokers.brokers[
      this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]
    ];

    if (receiver.readyState !== 1) {
      delete this.internalBrokers.brokers[this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]];
      this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers);
      this.internalBrokers.brokersAmount--;
      return this.publish(channel, message, ++tries);
    }

    receiver.send(Buffer.from(`${channel}%${JSON.stringify({ message })}`));

    if (channel === '#sendToWorkers')
      return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(message);

    this.channels.publish(channel, message);
    this.middleware.onPublish && this.middleware.onPublish(channel, message);
  }

  public broadcastMessage(_: string, message: Message): void {
    message = Buffer.from(message);
    const devider: number = message.indexOf(37);
    const channel: string = message.slice(0, devider).toString();
    const decodedMessage: any = JSON.parse(message.slice(devider + 1)).message;

    if (channel === '#sendToWorkers')
      return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(decodedMessage);

    this.middleware.onPublish && this.middleware.onPublish(channel, decodedMessage);
    this.channels.publish(channel, decodedMessage);
  }

  public setBroker(br: UWebSocket, url: string): void {
    this.internalBrokers.brokers[url] = br;
    this.internalBrokers.brokersKeys = Object.keys(this.internalBrokers.brokers);
    this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;

    const connectedChannels: string[] = Object.keys(this.channels.events);
    if (connectedChannels.length) br.send(JSON.stringify(connectedChannels));
  }
}
