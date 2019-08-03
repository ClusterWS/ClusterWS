// simple pub sub implementation for fast batch messaging publish

type Listener = (messages: { [key: string]: any[] }) => void;

interface PubSubEngineOptions {
  flushInterval?: number;
  onChannelCreated?: (channel: string) => void;
  onChannelDestroyed?: (channel: string) => void;
}

function noop(): void { /** noop function */ }

class PubSubEngine {
  // TODO: improve name
  public static globalUser: string = '*';

  private options: PubSubEngineOptions;
  private channelsUsers: { [key: string]: string[] } = {};
  private usersListeners: { [key: string]: Listener } = {};
  private channelsBatches: { [key: string]: any[] } = {};
  private boundFlush: () => void;

  constructor(options: PubSubEngineOptions = {}) {
    this.options = {
      flushInterval: 10,
      onChannelCreated: noop,
      onChannelDestroyed: noop,
      ...options
    };

    this.boundFlush = this.flush.bind(this);
    this.boundFlush();
  }

  public register(userId: string, listener: Listener): void {
    this.usersListeners[userId] = listener;
  }

  public unregister(userId: string): void {
    delete this.usersListeners[userId];
    // remove user from pubsub engine
    // TODO: find nice and fast way to remove
    // user from all subscribed channels
  }

  public unsubscribe(userId: string, channels: string[]): void {
    // unsubscribe user from channels
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const channel: string = channels[i];
      const usersArray: string[] | undefined = this.channelsUsers[channel];

      if (usersArray) {
        const index: number = usersArray.indexOf(userId);
        if (index !== -1) {
          usersArray.splice(index, 1);

          if (!usersArray.length) {
            // this is last subscriber we can delete channel entry
            delete this.channelsUsers[channel];

            // we inform if channel has been destroyed
            // only withing this instance
            this.options.onChannelDestroyed(channel);
          }
        }
      }
    }
  }

  public subscribe(userId: string, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const channel: string = channels[i];
      const usersArray: string[] | undefined = this.channelsUsers[channel];

      if (usersArray) {
        if (usersArray.indexOf(userId) === -1) {
          usersArray.push(userId);
        }

        continue;
      }

      this.channelsUsers[channel] = [userId];
      this.options.onChannelCreated(channel);
    }
  }

  public publish(channel: string, message: any, userId: string = null): void {
    // allow to publish to channels which do not exists for __DEFAULT__ user
    const batchForChannel: any[] = this.channelsBatches[channel];

    if (batchForChannel) {
      batchForChannel.push([userId, message]);
    } else {
      // if no messages have been published to this
      // channel within last flush create new entry
      this.channelsBatches[channel] = [[userId, message]];
    }
  }

  public getStats(): any {
    // TODO: re implement get stats
    return {
      channelsUsers: this.channelsUsers,
      usersListeners: this.usersListeners,
      channelsBatches: this.channelsBatches
    };
  }

  private flush(): void {
    // flush last batch to everyone
    const messagesToPublish: any = {};

    for (const channel in this.channelsBatches) {
      const users: any[] = this.channelsUsers[channel] || [];
      const messages: any[] = this.channelsBatches[channel] || [];

      // generate differently merged message for each user
      for (let i: number = 0, len: number = users.length; i < len; i++) {
        const userId: string = users[i];
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
      const startUserMessages: any[] = this.extractUserMessages(PubSubEngine.globalUser, messages);
      if (startUserMessages.length) {
        if (!messagesToPublish[PubSubEngine.globalUser]) {
          messagesToPublish[PubSubEngine.globalUser] = {};
        }

        messagesToPublish[PubSubEngine.globalUser][channel] = startUserMessages;
      }
    }

    this.channelsBatches = {};

    for (const userId in messagesToPublish) {
      const listener: Listener = this.usersListeners[userId];
      if (listener) {
        listener(messagesToPublish[userId]);
      }
    }

    // set next flush timeout
    setTimeout(this.boundFlush, this.options.flushInterval);
  }

  private extractUserMessages(userId: string, messages: any[]): any[] {
    const messagesForUserInChannel: any = [];
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

///////////////////////////////////////////////
///////////////////////////////////////////////
//// example of using new PubSubEngine     ////
//// user is responsible for cloning data  ////
///////////////////////////////////////////////
///////////////////////////////////////////////
const pubSubEngine: PubSubEngine = new PubSubEngine({
  onChannelCreated: (channel: string): void => {
    console.log(channel, 'has been created');
  },
  onChannelDestroyed: (channel: string): void => {
    console.log(channel, 'has been destroyed');
  }
});

pubSubEngine.register('*', (messages: any) => {
  console.log('*', messages);
});

pubSubEngine.register('user1', (messages: any) => {
  console.log('user1', messages);
});

pubSubEngine.register('user2', (messages: any) => {
  console.log('user2', messages);
});

pubSubEngine.subscribe('user1', ['hello world', 'another one']);

pubSubEngine.subscribe('user2', ['hello world']);

pubSubEngine.publish('hello world', 'My hello world message');

pubSubEngine.unsubscribe('user1', ['hello world']);

pubSubEngine.publish('hello world', 'My hello world message');

setTimeout(() => {
  pubSubEngine.publish('another one', 'My hello another one');
  pubSubEngine.publish('channel which does not exists', 'My hello world message');
  pubSubEngine.unsubscribe('user1', ['another one']);

  setTimeout(() => {
    pubSubEngine.publish('hello world', 'My hello world message from *', '*');
  }, 2000);
}, 5000);