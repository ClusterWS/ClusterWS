import { Listener, Message } from '../../utils/types';

// experementatl logic
// need to check if client exist and connected
export class Channel {
  public usersIds: string[] = [];
  public usersListeners: { [key: string]: Listener } = {};
  private messagesBatch: Message[] = [];

  constructor(public channelName: string, userId: string, listener: Listener) {
    this.subscribe(userId, listener);
  }

  public publish(id: string, message: Message): void {
    this.messagesBatch.push({ id, message });
  }

  public subscribe(userId: string, listener: Listener): void {
    this.usersIds.push(userId);
    this.usersListeners[userId] = listener;
  }

  public unsubscribe(userId: string): void {
    delete this.usersListeners[userId];
    // need to rethink remove logic
    this.usersIds.splice(this.usersIds.indexOf(userId), 1);

    // may need to subscribe to 2 channels for publish event
    if (!this.usersIds.length) {
      this.usersIds = [];
      this.messagesBatch = [];
      this.usersListeners = {};
      this.action('destroy', this.channelName);
    }
  }

  // instead of recraeting array i can use gap to replace data for that use
  public flush(): void {
    if (!this.messagesBatch.length) {
      return;
    }

    for (let i: number = 0, len: number = this.usersIds.length; i < len; i++) {
      const userId: string = this.usersIds[i];
      const sendMessage: Message = [];
      for (let j: number = 0, msgLen: number = this.messagesBatch.length; j < msgLen; j++) {
        if (this.messagesBatch[j].id !== userId) {
          sendMessage.push(this.messagesBatch[j].message);
        }
      }

      if (sendMessage.length) {
        this.usersListeners[userId](this.channelName, sendMessage);
      }
    }

    // can pass message array through this one to publish to the publish client
    // this.action('publish', this.roomName);

    this.messagesBatch = [];
  }

  public unfilteredFlush(message: Message): void {
    for (let i: number = 0, len: number = this.usersIds.length; i < len; i++) {
      const userId: string = this.usersIds[i];
      this.usersListeners[userId](message);
    }
  }

  public action(event: string, channel: string): void { /** To overwrite by user */ }
}
