import { EventEmitter } from '../../utils/emitter';
import { Listener, Message } from '../../utils/types';

export class Channel extends EventEmitter {
  public subscribers: { [key: string]: Listener } = {};
  public subscribersIds: string[] = [];

  private batch: Message[] = [];

  constructor(public channelName: string, userId: string, listener: Listener) {
    super();
    this.subscribe(userId, listener);
  }

  public publish(id: string, message: Message): void {
    this.batch.push({ id, message });
  }
  // publish specific message without batch
  public forcePublish(message: Message): void {
    for (let i: number = 0, len: number = this.subscribersIds.length; i < len; i++) {
      this.subscribers[this.subscribersIds[i]](message);
    }
  }

  public subscribe(userId: string, listener: Listener): void {
    this.subscribers[userId] = listener;
    this.subscribersIds.push(userId);
  }

  public unsubscribe(userId: string): void {
    delete this.subscribers[userId];
    this.subscribersIds.splice(this.subscribersIds.indexOf(userId), 1);

    if (!this.subscribersIds.length) {
      this.batch = [];
      this.subscribers = {};
      // emit to the client that channel is destroyed
      this.emit('destroy', this.channelName);
      this.removeEvents();
    }
  }

  // instead of recreating array i can use gap to replace data for that use
  // actually send message to the broker
  public batchFlush(): void {
    const batchLn: number = this.batch.length;
    const subscribersLn: number = this.subscribersIds.length;

    if (!batchLn) {
      return;
    }

    for (let i: number = 0; i < subscribersLn; i++) {
      const messages: Message = [];
      const subscriberId: string = this.subscribersIds[i];

      for (let j: number = 0; j < batchLn; j++) {
        if (this.batch[j].id !== subscriberId) {
          messages.push(this.batch[j].message);
        }
      }

      if (messages.length) {
        this.subscribers[subscriberId](this.channelName, messages);
      }
    }

    // we can move this message gen to above loop (in future);
    const brokerMessage: Message = [];
    for (let i: number = 0, len: number = batchLn; i < len; i++) {
      brokerMessage.push(this.batch[i].message);
    }

    this.batch = [];
    // emit completed
    this.emit('publish', this.channelName, brokerMessage);
  }
}
