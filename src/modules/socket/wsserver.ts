import { PubSubEngine } from '../pubsub';
import { EventEmitter } from '../../utils/emitter';
import { Options, Message, Middleware, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public middleware: { [s: number]: Listener } = {};
  private pubSub: PubSubEngine;

  constructor(private options: Options, securityKey: string) {
    // we pass "options" instead of "this.options" because "this" it was not initialized yet
    super(options.logger);
    this.pubSub = new PubSubEngine(options.logger, 5);

    this.pubSub.register('broker', (message: any) => {
      // TODO: handle logic for brokers
    });

    // TODO: add more control for user over subscribing to new channel
    this.pubSub.addListener('channelAdd', (channelName: string) => {
      this.middleware[Middleware.onChannelOpen] &&
        this.middleware[Middleware.onChannelOpen](channelName);
    });

    this.pubSub.addListener('channelClose', (channelName: string) => {
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