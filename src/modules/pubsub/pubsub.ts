import { Listener, Message } from '../../utils/types';

export class PubSubEngine {
  private changes: string[] = [];
  private batches: any = {};
  private registeredUsers: any = {};
  private registeredChannels: any = {};
  private hooks: any = {};

  constructor(private loopInterval: number) {
    this.loop();
  }

  public on(name: string, listener: Listener): void {
    this.hooks[name] = listener;
  }

  public getAllChannels(): string[] {
    return Object.keys(this.registeredChannels);
  }

  public register(userId: string, listener: Listener): void {
    this.registeredUsers[userId] = listener;
  }

  public deRegister(userId: string, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      this.unsubscribe(channels[i], userId);
    }
    delete this.registeredUsers[userId];
  }

  public subscribe(channelName: string, userId: string): void {
    if (!this.registeredUsers[userId]) {
      return;
    }

    if (this.registeredChannels[channelName]) {
      return this.registeredChannels[channelName].push(userId);
    }

    this.registeredChannels[channelName] = [userId];
    this.hooks['channelNew'] && this.hooks['channelNew'](channelName);
  }

  public unsubscribe(channelName: string, userId: string): void {
    const channel: string[] = this.registeredChannels[channelName];

    if (!channel) {
      return;
    }

    const userIndex: number = channel.indexOf(userId);
    if (userIndex !== -1) {
      channel.splice(userIndex, 1);
    }

    if (!channel.length) {
      delete this.registeredChannels[channelName];
      this.hooks['channelRemove'] && this.hooks['channelRemove'](channelName);
    }
  }

  public publish(channel: string, message: Message, id?: string): void {
    if (!this.registeredChannels[channel]) {
      return;
    }

    if (this.changes.indexOf(channel) === -1) {
      this.changes.push(channel);
    }

    const batch: any = this.batches[channel];
    if (batch) {
      return batch.push({ id, message });
    }

    this.batches[channel] = [{ id, message }];
  }

  private flush(): void {
    if (!this.changes.length) {
      return;
    }

    const allMessages: any = {};

    for (let i: number = 0, len: number = this.changes.length; i < len; i++) {
      const channel: string = this.changes[i];
      const batch: any[] = this.batches[channel];

      if (!batch || !batch.length) {
        continue;
      }

      const batchLen: number = batch.length;

      const users: string[] = this.registeredChannels[channel];
      for (let j: number = 0, userLen: number = users.length; j < userLen; j++) {
        const userId: string = users[j];
        const userMessages: any[] = [];

        for (let k: number = 0; k < batchLen; k++) {
          if (batch[k].id !== userId) {
            userMessages.push(batch[k].message);
          }
        }

        if (!userMessages.length) {
          continue;
        }

        if (!allMessages[userId]) {
          allMessages[userId] = {};
        }
        allMessages[userId][channel] = userMessages;
      }

      this.batches[channel] = [];
    }

    this.changes = [];

    for (const userId in allMessages) {
      if (allMessages[userId] && this.registeredUsers[userId]) {
        this.registeredUsers[userId](allMessages[userId]);
      }
    }
  }

  private loop(): void {
    setTimeout(() => {
      this.flush();
      this.loop();
    }, this.loopInterval);
  }
}