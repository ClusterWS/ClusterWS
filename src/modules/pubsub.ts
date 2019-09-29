// Version 2.0 Pub Sub

// TODO: add execution time for each function
type Listener = (messages: { [key: string]: any[] }) => void;

interface PubSubEngineOptions {
  sync: boolean;
  flushInterval: number;
  onChannelCreated: (channel: string) => void;
  onChannelDestroyed: (channel: string) => void;
}

function noop(): void { /** noop function */ }

function findIndexOf(arr: string[], value: string): number {
  for (let i: number = 0, len: number = arr.length; i < len; i++) {
    if (arr[i] === value) {
      return i;
    }
  }

  return -1;
}

function isObjectEmpty(object: { [key: string]: any }): boolean {
  if (object.hasOwnProperty('len')) {
    if (object.len <= 0) {
      return true;
    }

    return false;
  }

  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}

export class PubSubEngine {
  public static GLOBAL_USER: string = '*';

  private options: PubSubEngineOptions;
  private usersLink: { [key: string]: { listener: Listener, channels: string[] } } = {};
  private channelsUsers: { [key: string]: { len: number, [key: string]: string | number } } = {};

  // message handler
  private channelsBatches: { [key: string]: Array<[string | null, any]> } = {};

  // Flush options
  private boundFlush: () => void;
  private flushTimeout: NodeJS.Timeout;

  constructor(options: Partial<PubSubEngineOptions> = {}) {
    this.options = {
      sync: false,
      flushInterval: 10,
      onChannelCreated: noop,
      onChannelDestroyed: noop,
      ...options
    };

    this.boundFlush = this.flush.bind(this);
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

    if (!this.flushTimeout) {
      // schedule next flush within specified interval
      this.flushTimeout = setTimeout(this.boundFlush, this.options.flushInterval);
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
        let channelUsersObject: { len: number, [key: string]: string | number } | undefined = this.channelsUsers[channel];

        if (!channelUsersObject) {
          channelUsersObject = this.channelsUsers[channel] = {
            len: 0,
          };
          this.options.onChannelCreated(channel);
        }

        if (!channelUsersObject[userId]) {
          userInfo.channels.push(channel);
          channelUsersObject.len++;
          channelUsersObject[userId] = '1';
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
        const channelUsersObject: { len: number, [key: string]: string | number } | undefined = this.channelsUsers[channel];

        if (channelUsersObject && channelUsersObject[userId]) {
          channelUsersObject.len--;
          delete channelUsersObject[userId];

          userInfo.channels.splice(findIndexOf(userInfo.channels, channel), 1);

          if (isObjectEmpty(channelUsersObject)) {
            delete this.channelsUsers[channel];
            this.options.onChannelDestroyed(channel);
          }
        }
      }
    }
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
    this.flushTimeout = null;

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

// Tests TODO: need to move all test to separate files
const pubSubEngine: PubSubEngine = new PubSubEngine({ sync: false });

console.log('Start testing "Registration and Subscribing"');

// For comfortable work with millions of channels we need to increase
// --max-old-space-size (for large applications good size is 8gb per instance)
const shifting: number = 20;
const numberOfUsers: number = 50000;
const numberOfChannelsPerUser: number = 200;

// TODO: improve configurations for publish
const publishEvery: number = 15; // if 0 disable publish
const numberOfMessagesPerChannel: number = 1;

console.time('Registration and Subscribing');

let shiftSubscribe: number = 0;
for (let i: number = 0; i < numberOfUsers; i++) {
  pubSubEngine.register(`my_user_number_${i}`, (mgs: any): void => {
    // TODO: write throughput tests
  });

  for (let j: number = 0 + shiftSubscribe; j < numberOfChannelsPerUser + shiftSubscribe; j++) {
    pubSubEngine.subscribe(`my_user_number_${i}`, [`one_of_the_subscribed_channels_${j}`]);
  }

  shiftSubscribe = shiftSubscribe + shifting;
}

console.log(pubSubEngine.getStats());
console.timeEnd('Registration and Subscribing');

// console.log('Start testing "Unregister"');
// console.time('Unregister');

// for (let i: number = 0; i < numberOfUsers; i++) {
//   pubSubEngine.unregister(`my_user_number_${i}`);
// }

// console.log(pubSubEngine.getStats());
// console.timeEnd('Unregister');

// console.log('Start testing "Unsubscribe"');
// console.time('Unsubscribe');
// let shiftUnsubscribe: number = 0;

// // This is worst case scenario perf test when indexOf is always at the end
// for (let i: number = 0; i < numberOfUsers; i++) {
//   const channels: any[] = [];
//   for (let j: number = 0 + shiftUnsubscribe; j < numberOfChannelsPerUser + shiftUnsubscribe; j++) {
//     channels.push(`one_of_the_subscribed_channels_${numberOfChannelsPerUser + shiftUnsubscribe + shiftUnsubscribe - j - 1}`);
//   }

//   pubSubEngine.unsubscribe(`my_user_number_${i}`, channels);
//   shiftUnsubscribe = shiftUnsubscribe + shifting;
// }

// console.log(pubSubEngine.getStats());
// console.timeEnd('Unsubscribe');
if (publishEvery) {
  // TODO: need to improve publish logic
  let numberOfChannels = pubSubEngine.getStats().numberOfChannels;
  setInterval(() => {
    console.time('Publishing data');

    for (let j: number = 0; j < numberOfChannels; j++) {
      for (let i = 0; i < numberOfMessagesPerChannel; i++) {
        pubSubEngine.publish(`one_of_the_subscribed_channels_${j}`, { str: "my message" + i });
      }
    }

    console.timeEnd('Publishing data');
  }, publishEvery);
}

setInterval(() => {
  console.log(pubSubEngine.getStats());
  // handle stuff here
}, 20000);