import { PubSubEngine } from '../pubsub';
import { EventEmitter } from '../../utils/emitter';
import { Options, Message } from '../../utils/types';

export class WSServer extends EventEmitter {
  private pubSub: PubSubEngine;

  constructor(private options: Options, securityKey: string) {
    super(options.logger);
    this.pubSub = new PubSubEngine(options.logger, 1000);

    this.pubSub.register('broker', (message: any) => {
      // to do handle messages for broker
    });
  }

  public publish(channelName: string, message: Message, id?: string): void {
    this.pubSub.publish(channelName, message, id);
  }

  public subscribe(channelName: string, id: string): void {
    this.pubSub.subscribe(id, channelName);
  }

  // TODO: add unsubscribe
}