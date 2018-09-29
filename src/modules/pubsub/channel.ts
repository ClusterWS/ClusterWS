import { Listener, Message } from '../../utils/types';

// experementatl logic
// need to check if client exist and connected
export class Channel {
  public subs: { [key: string]: Listener } = {};
  public subsIds: string[] = [];
  private messagesBatch: Message[] = [];

  constructor(public channelName: string, userId: string, listener: Listener) {
    this.subscribe(userId, listener);
  }

  public publish(id: string, message: Message): void {
    this.messagesBatch.push({ id, message });
  }

  public subscribe(userId: string, listener: Listener): void {
    this.subsIds.push(userId);
    this.subs[userId] = listener;
  }

  public unsubscribe(userId: string): void {
    delete this.subs[userId];
    // need to rethink remove logic
    this.subsIds.splice(this.subsIds.indexOf(userId), 1);

    // may need to subscribe to 2 channels for publish event
    if (!this.subsIds.length) {
      this.subs = {};
      this.subsIds = [];
      this.messagesBatch = [];
      this.action('destroy', this.channelName);
    }
  }

  // instead of recraeting array i can use gap to replace data for that use
  // actually send message to the broker
  public flush(): void {
    const subsLength: number = this.subsIds.length;
    const batchLength: number = this.messagesBatch.length;

    if (!batchLength) {
      return;
    }

    for (let i: number; i < subsLength; i++) {
      const subId: string = this.subsIds[i];
      const messages: Message = [];

      for (let j: number = 0; j < batchLength; j++) {
        if (this.messagesBatch[j].id !== subId) {
          messages.push(this.messagesBatch[j].message);
        }
      }

      if (messages.length) {
        this.subs[subId](this.channelName, messages);
      }
    }

    // we can move this message gen to above loop (in future);
    const brokerMessage: Message = [];
    for (let i: number = 0, len: number = batchLength; i < len; i++) {
      brokerMessage.push(this.messagesBatch[i].message);
    }

    // pass message array to the publish wss broker
    this.action('publish', this.channelName, brokerMessage);
    this.messagesBatch = [];
  }

  // rename this function
  public unfilteredFlush(message: Message): void {
    for (let i: number = 0, len: number = this.subsIds.length; i < len; i++) {
      this.subs[this.subsIds[i]](message);
    }
  }

  public action(event: string, channel: string, data?: Message): void { /** To overwrite by user */ }
}
