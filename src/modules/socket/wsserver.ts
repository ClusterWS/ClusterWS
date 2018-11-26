import { Socket } from './socket';
import { WebSocket } from '../cws/client';
import { EventEmitterMany } from '../emitter/many';
import { EventEmitterSingle } from '../emitter/single';
import { logWarning, keysOf } from '../../utils/functions';
import { CustomObject, Message, Listener, Brokers } from '../../utils/types';

export class WSServer extends EventEmitterSingle {
  public channels: EventEmitterMany = new EventEmitterMany();
  public middleware: CustomObject = {};

  private internalBrokers: Brokers = {
    brokers: {},
    nextBroker: -1,
    brokersKeys: [],
    brokersAmount: 0
  };

  constructor() {
    super();

    this.channels.changeChannelStatusInBroker = (event: string, eventType: string): void => {
      if (eventType === 'create') {
        this.middleware.onChannelOpen && this.middleware.onChannelOpen(event);
      }
      if (eventType === 'destroy') {
        this.middleware.onChannelClose && this.middleware.onChannelClose(event);
      }
      for (let i: number = 0; i < this.internalBrokers.brokersAmount; i++) {
        const receiver: WebSocket = this.internalBrokers.brokers[this.internalBrokers.brokersKeys[i]];
        if (receiver.readyState === 1) receiver.send(event);
      }
    };
  }

  public setMiddleware(name: 'onPublish', listener: (channel: string, message: Message) => void): void;
  public setMiddleware(name: 'onSubscribe', listener: (socket: Socket, channel: string, next: Listener) => void): void;
  public setMiddleware(name: 'onUnsubscribe', listener: (socket: Socket, channel: string) => void): void;
  public setMiddleware(name: 'verifyConnection', listener: (info: CustomObject, next: Listener) => void): void;
  public setMiddleware(name: 'onMessageReceive', listener: (socket: Socket, message: Message, next: Listener) => void): void;
  public setMiddleware(name: 'onMessageFromWorker', listener: (message: Message) => void): void;
  public setMiddleware(name: 'onChannelClose' | 'onChannelOpen', listener: (channel: string) => void): void;
  public setMiddleware(name: string, listener: Listener): void {
    this.middleware[name] = listener;
  }

  public setWatcher(channelName: string, listener: Listener): void {
    this.channels.subscribe(channelName, (_: string, ...args: any[]) => listener(...args), 'worker');
  }

  public removeWatcher(channelName: string): void {
    this.channels.unsubscribe(channelName, 'worker');
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
      this.clearBroker(this.internalBrokers.brokersKeys[this.internalBrokers.nextBroker]);
      return this.publish(channel, message, ++tries);
    }

    receiver.send(Buffer.from(`${channel}%${JSON.stringify({ message })}`));

    if (channel === '#sendToWorkers')
      return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(message);

    this.channels.publish(channel, message);
    this.middleware.onPublish && this.middleware.onPublish(channel, message);
  }

  public broadcastMessage(_: string, message: Message): void {
    const parsedMessage: Message = Buffer.from(message);
    const devider: number = parsedMessage.indexOf(37);
    const channel: string = parsedMessage.slice(0, devider).toString();
    const decodedMessage: Message = JSON.parse(parsedMessage.slice(devider + 1)).message;

    if (channel === '#sendToWorkers')
      return this.middleware.onMessageFromWorker && this.middleware.onMessageFromWorker(decodedMessage);

    this.middleware.onPublish && this.middleware.onPublish(channel, decodedMessage);
    this.channels.publish(channel, decodedMessage);
  }

  public clearBroker(url: string): void {
    if (!this.internalBrokers.brokers[url]) return;
    delete this.internalBrokers.brokers[url];
    this.internalBrokers.brokersKeys = keysOf(this.internalBrokers.brokers);
    this.internalBrokers.brokersAmount--;
  }

  public setBroker(br: WebSocket, url: string): void {
    this.internalBrokers.brokers[url] = br;
    this.internalBrokers.brokersKeys = keysOf(this.internalBrokers.brokers);
    this.internalBrokers.brokersAmount = this.internalBrokers.brokersKeys.length;

    const connectedChannels: string[] = keysOf(this.channels.events);
    if (connectedChannels.length) br.send(JSON.stringify(connectedChannels));
  }
}
