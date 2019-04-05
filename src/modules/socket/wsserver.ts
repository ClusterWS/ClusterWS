import { PubSubEngine } from '../pubsub';
import { EventEmitter } from '../../utils/emitter';
import { BrokerConnector } from '../broker/connector';
import { Mode, Options, Message, Middleware, Listener } from '../../utils/types';

// TODO: handle single process mode
export class WSServer extends EventEmitter {
  public middleware: { [s: number]: Listener } = {};

  private pubSub: PubSubEngine;
  private brokerConnector: BrokerConnector;

  constructor(private options: Options, securityKey: string) {
    // we pass "options" instead of "this.options" because "this" it was not yet initialized
    super(options.logger);
    this.pubSub = new PubSubEngine(this.options.logger, 5);
    if (this.options.mode !== Mode.SingleProcess) {
      // TODO: refactor this part (in future)
      this.brokerConnector = new BrokerConnector(
        this.options,
        this.publish.bind(this),
        this.pubSub.getChannels.bind(this.pubSub),
        securityKey
      );
    }

    this.pubSub.register('broker', (message: Message) => {
      if (this.options.mode !== Mode.SingleProcess) {
        this.brokerConnector.publish(JSON.stringify(message));
      }
    });

    // TODO: add more control for user over subscribing to new channel and channelClose (in future)
    this.pubSub.addListener('channelAdd', (channelName: string) => {
      if (this.options.mode !== Mode.SingleProcess) {
        this.brokerConnector.subscribe(channelName);
      }
      this.middleware[Middleware.onChannelOpen] &&
        this.middleware[Middleware.onChannelOpen](channelName);
    });

    this.pubSub.addListener('channelClose', (channelName: string) => {
      if (this.options.mode !== Mode.SingleProcess) {
        this.brokerConnector.unsubscribe(channelName);
      }
      this.middleware[Middleware.onChannelClose] &&
        this.middleware[Middleware.onChannelClose](channelName);
    });
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