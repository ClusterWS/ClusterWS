// simple pub sub implementation for fast batch messaging publish

type Listener = (messages: { [key: string]: any[] }) => void;

interface PubSubEngineOptions {
  flushInterval?: number;
  onChannelCreated?: (channel: string) => void;
  onChannelDestroyed?: (channel: string) => void;
}

function isObjectEmpty(object: any): boolean {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

// seems like default indexOf is a bit slower
// function indexOf(arr: string[], el: string): number {
//   for (let i: number = 0, len: number = arr.length; i < len; i++) {
//     if (arr[i] === el) {
//       return i;
//     }
//   }

//   return -1;
// }

function noop(): void { /** noop function */ }

class PubSubEngine {
  // TODO: improve name
  public static globalUser: string = '*';

  private options: PubSubEngineOptions;
  private channelsUsers: { [key: string]: { [key: string]: number } } = {};
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
      const channelUsersObject: { [key: string]: number } | undefined = this.channelsUsers[channel];

      if (channelUsersObject) {
        delete channelUsersObject[userId];

        if (isObjectEmpty(channelUsersObject)) {
          // this is last subscriber we can delete channel entirely
          delete this.channelsUsers[channel];
          this.options.onChannelDestroyed(channel);
        }
      }
    }
  }

  public subscribe(userId: string, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const channel: string = channels[i];
      const channelUsersObject: { [key: string]: number } | undefined = this.channelsUsers[channel];

      if (channelUsersObject) {
        channelUsersObject[userId] = 1;
        continue;
      }

      this.channelsUsers[channel] = {};
      this.channelsUsers[channel][userId] = 1;
      this.options.onChannelCreated(channel);
    }
  }

  public publish(channel: string, message: any, userId: string = null): void {
    // allow to publish to channels which do not exists for '*' user
    const batchForChannel: any[] = this.channelsBatches[channel];

    if (batchForChannel) {
      batchForChannel.push([userId, message]);
    } else {
      // TODO: there is some room for optimization
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
    // TODO: optimize flush
    // flush last batch to everyone
    const messagesToPublish: any = {};

    for (const channel in this.channelsBatches) {
      const messages: any[] = this.channelsBatches[channel] || [];

      // generate differently merged message for each user
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

// const pubSubEngine: PubSubEngine = new PubSubEngine({
//   onChannelCreated: (channel: string): void => {
//     console.log(channel, 'has been created');
//   },
//   onChannelDestroyed: (channel: string): void => {
//     console.log(channel, 'has been destroyed');
//   }
// });

// pubSubEngine.register('*', (messages: any) => {
//   console.log('*', messages);
// });

// pubSubEngine.register('user1', (messages: any) => {
//   console.log('user1', messages);
// });

// pubSubEngine.register('user2', (messages: any) => {
//   console.log('user2', messages);
// });

// pubSubEngine.subscribe('user1', ['hello world', 'another one']);

// pubSubEngine.subscribe('user2', ['hello world']);

// pubSubEngine.publish('hello world', 'My hello world message');

// pubSubEngine.unsubscribe('user1', ['hello world']);

// pubSubEngine.publish('hello world', 'My hello world message');

// setTimeout(() => {
//   pubSubEngine.publish('another one', 'My hello another one');
//   pubSubEngine.publish('channel which does not exists', 'My hello world message');
//   pubSubEngine.unsubscribe('user1', ['another one']);

//   setTimeout(() => {
//     pubSubEngine.publish('hello world', 'My hello world message from *', '*');
//   }, 2000);
// }, 5000);


// Memory and perf testing
const pubSubEngine: PubSubEngine = new PubSubEngine();

console.log("Started");
console.time("Perf");
// let recieved = 0;
let shift = 0;

for (let i = 0; i < 50000; i++) {
  pubSubEngine.register(`my_user_number_${i}`, (msgs: any): void => {
    // recieved++;
  });

  let channels = [];
  for (let j = 0 + shift; j < 100 + shift; j++) {
    channels.push(`one_of_the_subscribed_channels_${j}`);
  }
  pubSubEngine.subscribe(`my_user_number_${i}`, channels);
  shift = shift + 20;
}

console.timeEnd("Perf");
console.log("Ended");

// let sent = 0;
let publishShift = 0;
// Publish perf load
setInterval(() => {
  let complexMessage = {
    hello: ["string", 1234, {}],
    m: "asdfasf"
  };

  const someLongString = "long message string which will be copied for each user and may cayse memory leak"

  for (let i = 0 + publishShift; i < 1000 + publishShift; i++) {
    pubSubEngine.publish(`one_of_the_subscribed_channels_${i}`, someLongString, `my_user_number_${i}`);
  }
  // sent++;
  publishShift = publishShift + 1000;
  if (publishShift > 1000000) {
    publishShift = 0;
  }
}, 5);


// setInterval(() => {
//   console.log(sent, recieved);
// }, 5000)


// const generateLargeObject = {};

// for (let i = 0; i < 10000; i++) {
//   const generatedArray = [];
//   for (let j = 0; j < 2000; j++) {
//     generatedArray.push(`some_super_slinga_asmlknas_kmasd_${j}`);
//   }
//   generateLargeObject[`${i}_object`] = generatedArray;
// }

// console.log(Object.keys(generateLargeObject).length);
// console.time('Search');

// let match = 0;
// for (const key in generateLargeObject) {
//   generateLargeObject[key].splice(generateLargeObject[key].indexOf(`some_super_slinga_asmlknas_kmasd_4003`), 1);
//   match++;
// }

// console.timeEnd('Search');
// console.log(match);
