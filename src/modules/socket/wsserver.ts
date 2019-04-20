import { PubSubEngine } from '../pubsub';
import { EventEmitter } from '../../utils/emitter';
import { RedisConnector } from '../connectors/redis';
import { BrokerConnector } from '../connectors/broker';
import { Mode, Options, Message, Middleware, Listener, Scaler } from '../../utils/types';

export class WSServer extends EventEmitter {
  public middleware: { [s: number]: Listener } = {};

  private pubSub: PubSubEngine;
  private connector: BrokerConnector | RedisConnector;

  constructor(private options: Options, securityKey: string) {
    // we pass "options" instead of "this.options" because "this" it was not yet initialized
    super(options.logger);

    // automatically predefined #workersLine channel to receive all message from workers
    this.pubSub = new PubSubEngine(this.options.logger, 5, { '#workersLine': ['#broker', '#worker'] });

    if (this.options.mode !== Mode.Single) {
      if (this.options.scaleOptions.scaler === Scaler.Default) {
        this.connector = new BrokerConnector(
          this.options,
          this.publish.bind(this),
          this.pubSub.getChannels.bind(this.pubSub),
          securityKey
        );
      }

      if (this.options.scaleOptions.scaler === Scaler.Redis) {
        this.connector = new RedisConnector(
          this.options,
          this.publish.bind(this),
          this.pubSub.getChannels.bind(this.pubSub),
          securityKey
        );
      }
    }

    this.pubSub.register('#worker', (message: Message) => {
      if (this.middleware[Middleware.onMessageFromWorker]) {
        // automatically replay messages
        const batch: any[] = message['#workersLine'];
        for (let i: number = 0, len: number = batch.length; i < len; i++) {
          this.middleware[Middleware.onMessageFromWorker](batch[i]);
        }
      }
    });

    this.pubSub.register('#broker', (message: Message) => {
      if (this.options.mode !== Mode.Single) {
        this.connector.publish(message);
      }
    });

    // TODO: add more control for user over subscribing to new channel and channelClose (in future)
    this.pubSub.addListener('channelAdd', (channelName: string) => {
      if (this.options.mode !== Mode.Single) {
        this.connector.subscribe(channelName);
      }
      this.middleware[Middleware.onChannelOpen] &&
        this.middleware[Middleware.onChannelOpen](channelName);
    });

    this.pubSub.addListener('channelClose', (channelName: string) => {
      if (this.options.mode !== Mode.Single) {
        this.connector.unsubscribe(channelName);
      }
      this.middleware[Middleware.onChannelClose] &&
        this.middleware[Middleware.onChannelClose](channelName);
    });
  }

  public publishToWorkers(message: Message): void {
    this.publish('#workersLine', message, '#worker');
  }

  public addMiddleware(middlewareType: Middleware, listener: Listener): void {
    this.middleware[middlewareType] = listener;
  }

  // publish message to specific channel (id is used to do not send message to actual publisher)
  public publish(channelName: string, message: Message, id?: string): void {
    this.pubSub.publish(channelName, message, id);
  }

  // Only for internal usage from socket.ts
  public subscribe(id: string, channelName: string): void {
    this.pubSub.subscribe(id, channelName);
  }

  // Only for internal usage from socket.ts
  public unsubscribe(id: string, channelName: string): void {
    this.pubSub.unsubscribe(id, channelName);
  }
}