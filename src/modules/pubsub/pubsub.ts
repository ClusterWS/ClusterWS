import { noop, indexOf, objectIsEmpty } from '../utils';

type Listener = (messages: { [key: string]: any[] }) => void;

export class PubSubEngine {
  public static GLOBAL_USER: string = '__*__';

  private options: { sync: boolean };
  private usersLink: { [key: string]: { listener: Listener, channels: string[] } } = {};
  private channelsUsers: { [key: string]: { len: number, [key: string]: boolean | number } } = {};

  // message handler
  private channelsBatches: { [key: string]: Array<[string | null, any]> } = {};

  private flushScheduled: boolean;
  private boundFlush: () => void;

  private onChannelCreatedListener: (channel: string) => void = noop;
  private onChannelDestroyedListener: (channel: string) => void = noop;

  constructor(options: { sync?: boolean } = {}) {
    this.options = {
      sync: false,
      ...options
    };

    this.boundFlush = this.flush.bind(this);
  }

  public onChannelCreated(listener: (channel: string) => void): void {
    this.onChannelCreatedListener = listener;
  }

  public onChannelDestroyed(listener: (channel: string) => void): void {
    this.onChannelDestroyedListener = listener;
  }

  public publish(channel: string, message: any, user: string = null): void {
    const channelBatch: Array<[string | null, any]> | undefined = this.channelsBatches[channel];

    if (channelBatch) {
      channelBatch.push([user, message]);
    } else {
      this.channelsBatches[channel] = [[user, message]];
    }

    if (this.options.sync) {
      // if sync is true we want to flush immediately
      return this.flush();
    }

    if (!this.flushScheduled) {
      // schedule next flush within specified interval
      this.flushScheduled = true;
      process.nextTick(this.boundFlush);
    }
  }

  public register(userId: string, listener: Listener): void {
    this.usersLink[userId] = { listener, channels: [] };
  }

  public subscribe(userId: string, channels: string[]): void {
    const userInfo: { listener: Listener, channels: string[] } | undefined = this.usersLink[userId];

    if (userInfo) {
      for (let i: number = 0, len: number = channels.length; i < len; i++) {
        const channel: string = channels[i];
        let channelUsersObject: { len: number, [key: string]: boolean | number } | undefined = this.channelsUsers[channel];

        if (!channelUsersObject) {
          channelUsersObject = this.channelsUsers[channel] = {
            len: 0,
          };
          this.onChannelCreatedListener(channel);
        }

        if (!channelUsersObject[userId]) {
          userInfo.channels.push(channel);
          channelUsersObject.len++;
          channelUsersObject[userId] = true;
        }
      }
    }
  }

  public unregister(userId: string): void {
    const userInfo: { listener: Listener, channels: string[] } | undefined = this.usersLink[userId];
    if (userInfo) {
      this.unsubscribe(userId, [...userInfo.channels]);
      delete this.usersLink[userId];
    }
  }

  public unsubscribe(userId: string, channels: string[]): void {
    const userInfo: { listener: Listener, channels: string[] } | undefined = this.usersLink[userId];
    if (userInfo) {
      for (let i: number = 0, len: number = channels.length; i < len; i++) {
        const channel: string = channels[i];
        const channelUsersObject: { len: number, [key: string]: boolean | number } | undefined = this.channelsUsers[channel];

        if (channelUsersObject && channelUsersObject[userId]) {
          channelUsersObject.len--;
          delete channelUsersObject[userId];

          userInfo.channels.splice(indexOf(channel, userInfo.channels), 1);

          if (channelUsersObject.len <= 0 || objectIsEmpty(channelUsersObject)) {
            delete this.channelsUsers[channel];
            this.onChannelDestroyedListener(channel);
          }
        }
      }
    }
  }

  public getChannels(): string[] {
    return Object.keys(this.channelsUsers);
  }

  public getStats(): any {
    // TODO: add more useful stats
    // let maxUsersPerChannel: number = 0;

    // for (const channel in this.channelsUsers) {
    //   const subscribed: number = Object.keys(this.channelsUsers[channel]).length;
    //   if (subscribed > maxUsersPerChannel) {
    //     maxUsersPerChannel = subscribed;
    //   }
    // }

    return {
      numberOfUsers: Object.keys(this.usersLink).length,
      numberOfChannels: Object.keys(this.channelsUsers).length,
    };
  }

  private flush(): void {
    // TODO: improve logic
    const messagesToPublish: any = {};

    for (const channel in this.channelsBatches) {
      const messages: any[] = this.channelsBatches[channel] || [];

      for (const userId in this.channelsUsers[channel] || {}) {
        const userMessages: any[] = this.extractUserMessages(userId, messages);
        if (userMessages.length) {
          if (!messagesToPublish[userId]) {
            messagesToPublish[userId] = {};
          }

          messagesToPublish[userId][channel] = userMessages;
        }
      }

      // generate messages for default user '*'
      // which listens to all messages except it is own
      const startUserMessages: any[] = this.extractUserMessages(PubSubEngine.GLOBAL_USER, messages);
      if (startUserMessages.length) {
        if (!messagesToPublish[PubSubEngine.GLOBAL_USER]) {
          messagesToPublish[PubSubEngine.GLOBAL_USER] = {};
        }

        messagesToPublish[PubSubEngine.GLOBAL_USER][channel] = startUserMessages;
      }
    }

    // reset flush for next iteration
    this.channelsBatches = {};
    this.flushScheduled = false;
    for (const userId in messagesToPublish) {
      const user: { listener: Listener, channels: string[] } | undefined = this.usersLink[userId];
      if (user) {
        user.listener(messagesToPublish[userId]);
      }
    }
  }

  private extractUserMessages(userId: string, messages: any[]): any[] {
    const messagesForUserInChannel: any[] = [];
    for (let i: number = 0, len: number = messages.length; i < len; i++) {
      const message: any[] = messages[i];

      // exclude messages which belong to this user
      if (message[0] !== userId) {
        messagesForUserInChannel.push(message[1]);
      }
    }

    return messagesForUserInChannel;
  }
}
