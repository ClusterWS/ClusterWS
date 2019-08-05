// simple pub sub implementation for fast batch messaging publish

type Listener = (messages: { [key: string]: any[] }) => void;

interface PubSubEngineOptions {
  flushInterval?: number;
  onChannelCreated?: (channel: string) => void;
  onChannelDestroyed?: (channel: string) => void;
}

function noop(): void { /** noop function */ }
function isObjectEmpty(object: any): boolean {
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
  private usersLink: { [key: string]: { listener: Listener, channels: { [key: string]: number } } } = {};
  private channelsUsers: { [key: string]: { [key: string]: number } } = {};
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
    this.usersLink[userId] = {
      listener,
      channels: {}
    };
  }

  public unregister(userId: string): void {
    const user: { listener: Listener, channels: { [key: string]: number } } | undefined = this.usersLink[userId];
    if (user) {
      for (const channel in user.channels) {
        const channelUsers: { [key: string]: number } = this.channelsUsers[channel];
        delete channelUsers[userId];

        if (isObjectEmpty(channelUsers)) {
          // this is last subscriber we can delete channel entirely
          delete this.channelsUsers[channel];
          this.options.onChannelDestroyed(channel);
        }
      }

      delete this.usersLink[userId];
    }
  }

  public unsubscribe(userId: string, channels: string[]): void {
    // unsubscribe user from channels
    const user: { listener: Listener, channels: { [key: string]: number } } | undefined = this.usersLink[userId];
    if (user) {
      for (let i: number = 0, len: number = channels.length; i < len; i++) {
        const channel: string = channels[i];
        const channelUsersObject: { [key: string]: number } | undefined = this.channelsUsers[channel];

        if (channelUsersObject) {
          delete channelUsersObject[userId];
          delete user.channels[channel];

          if (isObjectEmpty(channelUsersObject)) {
            // this is last subscriber we can delete channel entirely
            delete this.channelsUsers[channel];
            this.options.onChannelDestroyed(channel);
          }
        }
      }
    }
  }

  public subscribe(userId: string, channels: string[]): void {
    const user: { listener: Listener, channels: { [key: string]: number } } | undefined = this.usersLink[userId];
    if (user) {
      for (let i: number = 0, len: number = channels.length; i < len; i++) {
        const channel: string = channels[i];
        const channelUsersObject: { [key: string]: number } | undefined = this.channelsUsers[channel];

        user.channels[channel] = 1;

        if (channelUsersObject) {
          channelUsersObject[userId] = 1;
          continue;
        }

        this.channelsUsers[channel] = {};
        this.channelsUsers[channel][userId] = 1;
        this.options.onChannelCreated(channel);
      }
    }
  }

  public publish(channel: string, message: any, userId: string = null): void {
    // allows to publish to channels which do not exists with '*' user
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
    // TODO: add more useful stats
    return {
      numberOfUsers: Object.keys(this.usersLink).length,
      numberOfChannels: Object.keys(this.channelsUsers).length
    };
  }

  private flush(): void {
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
      const startUserMessages: any[] = this.extractUserMessages(PubSubEngine.GLOBAL_USER, messages);
      if (startUserMessages.length) {
        if (!messagesToPublish[PubSubEngine.GLOBAL_USER]) {
          messagesToPublish[PubSubEngine.GLOBAL_USER] = {};
        }

        messagesToPublish[PubSubEngine.GLOBAL_USER][channel] = startUserMessages;
      }
    }

    this.channelsBatches = {};

    for (const userId in messagesToPublish) {
      const user: { listener: Listener, channels: { [key: string]: number } } | undefined = this.usersLink[userId];
      if (user) {
        user.listener(messagesToPublish[userId]);
      }
    }

    // set next flush timeout
    setTimeout(this.boundFlush, this.options.flushInterval);
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

console.log('Start testing "Registration and Subscribing"');

const pubSubEngine: PubSubEngine = new PubSubEngine();

console.time('Registration and Subscribing');
const shifting: number = 100;
const numberOfUsers: number = 30000;

let shift: number = 0;

for (let i: number = 0; i < numberOfUsers; i++) {
  pubSubEngine.register(`my_user_number_${i}`, (mgs: any): void => {
    // TODO: write throughput tests
  });

  const channels: any[] = [];
  for (let j: number = 0 + shift; j < 250 + shift; j++) {
    channels.push(`one_of_the_subscribed_channels_${j}`);
  }
  pubSubEngine.subscribe(`my_user_number_${i}`, channels);
  shift = shift + shifting;
}

console.log(pubSubEngine.getStats());
console.timeEnd('Registration and Subscribing');

console.time('Unsubscribe');
let shiftUnsubscribe: number = 0;

for (let i: number = 0; i < numberOfUsers; i++) {
  const channels: any[] = [];
  for (let j: number = 0 + shiftUnsubscribe; j < 250 + shiftUnsubscribe; j++) {
    channels.push(`one_of_the_subscribed_channels_${j}`);
  }
  pubSubEngine.unsubscribe(`my_user_number_${i}`, channels);
  shiftUnsubscribe = shiftUnsubscribe + shifting;
}

console.log(pubSubEngine.getStats());
console.timeEnd('Unsubscribe');

// console.log('Start testing "Unregister"');
// console.time('Unregister');

// for (let i: number = 0; i < numberOfUsers; i++) {
//   pubSubEngine.unregister(`my_user_number_${i}`);
// }

// console.log(pubSubEngine.getStats());
// console.timeEnd('Unregister');

//////
//////
//////
//////
/////
//////
// let publishShift = 0;
// // Publish perf load
// setInterval(() => {
//   let complexMessage = {
//     hello: ["string", 1234, {}],
//     m: "asdfasf"
//   };

//   const someLongString = "long message string which will be copied for each user and may cayse memory leak"

//   for (let i = 0 + publishShift; i < 1000 + publishShift; i++) {
//     pubSubEngine.publish(`one_of_the_subscribed_channels_${i}`, complexMessage, `my_user_number_${i}`);
//   }
//   publishShift = publishShift + 1000;
//   if (publishShift > 1000000) {
//     publishShift = 0;
//   }
// }, 5);

// setInterval(() => {
//   // print some stats
//   console.log(pubSubEngine.getStats());
// }, 10000);

// setTimeout(() => {
// }, 60 * 1000);


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
