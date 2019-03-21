import { Listener, Message, Logger } from '../utils/types';

// TODO: Fix serious bug with data reference :(
export class PubSubEngine {
  private hooks: { [key: string]: Listener } = {};
  private users: { [key: string]: Listener } = {};
  private batches: { [key: string]: Message[] } = {};
  private channels: { [key: string]: string[] } = {};

  constructor(private logger: Logger, private interval: number) {
    this.run();
  }

  public addListener(event: string, listener: Listener): void {
    this.hooks[event] = listener;
  }

  public register(userId: string, listener: Listener): void {
    this.users[userId] = listener;
  }

  // TODO: add unregister function to be able to remove old users

  public subscribe(userId: string, channel: string): any {
    if (!this.users[userId]) {
      return this.logger.warning(`Trying to subscribe not existing user ${userId}`);
    }

    if (this.channels[channel]) {
      return this.channels[channel].push(userId);
    }

    this.logger.debug(`PubSubEngine`, `'${channel}' has been created`);
    if (this.hooks['channelAdd']) {
      this.hooks['channelAdd'](channel);
    }
    this.channels[channel] = ['broker', userId];
  }

  public unsubscribe(userId: string, channel: string): void {
    const channelArray: string[] = this.channels[channel];
    if (channelArray && channelArray.length) {
      const userIndex: number = channelArray.indexOf(userId);
      if (userIndex !== -1) {
        channelArray.splice(userIndex, 1);
      }
    }

    // remove channels object if there is no users any more
    if (channelArray && channelArray.length === 1) {
      this.logger.debug(`PubSubEngine`, `'${channel}' has been removed`);
      if (this.hooks['channelDelete']) {
        this.hooks['channelDelete'](channel);
      }
      delete this.channels[channel];
    }
  }

  public publish(channel: string, message: Message, userId?: string): any {
    // publish message to the channel
    const batch: Message[] = this.batches[channel];
    if (batch) {
      return batch.push({ userId, message });
    }

    this.batches[channel] = [{ userId, message }];
  }

  private flush(): void {
    const preparedMessages: any = {};
    for (const channel in this.batches) {
      if (this.batches[channel]) {
        const users: string[] = this.channels[channel];

        if (users) {
          const batch: Message[] = this.batches[channel];
          const batchLen: number = batch.length;

          for (let j: number = 0, userLen: number = users.length; j < userLen; j++) {
            const userId: string = users[j];
            const userSpecificMessages: any[] = [];

            for (let k: number = 0; k < batchLen; k++) {
              if (batch[k].userId !== userId) {
                userSpecificMessages.push(batch[k].message);
              }
            }

            if (userSpecificMessages.length) {
              if (!preparedMessages[userId]) {
                preparedMessages[userId] = {};
              }
              preparedMessages[userId][channel] = userSpecificMessages;
            }
          }
        }
      }
    }

    this.batches = {};
    for (const userId in preparedMessages) {
      if (this.users[userId]) {
        this.users[userId](preparedMessages[userId]);
      }
    }
  }

  private run(): void {
    setTimeout(() => {
      this.flush();
      this.run();
    }, this.interval);
  }
}