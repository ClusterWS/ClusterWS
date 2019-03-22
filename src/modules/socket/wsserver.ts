import { PubSubEngine } from '../pubsub';
import { EventEmitter } from '../../utils/emitter';
import { Options, Message } from '../../utils/types';

export class WSServer extends EventEmitter {
  private pubSub: PubSubEngine;

  constructor(private options: Options, securityKey: string) {
    super(options.logger);
    // TODO: need to fix timer for pubSub engine
    this.pubSub = new PubSubEngine(options.logger, 5);

    this.pubSub.register('broker', (message: any) => {
      // TODO: handle messages for broker
      // console.log(message);
    });
  }

  // TODO: add middleware

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