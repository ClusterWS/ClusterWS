// Version 2.0 Pub Sub
// improve memory management, minor sacrifice in performance

type Listener = (messages: { [key: string]: any[] }) => void;

function findIndexOf(arr: string[], value: string): number {
  for (let i: number = 0, len: number = arr.length; i < len; i++) {
    if (arr[i] === value) {
      return i;
    }
  }

  return -1;
}

function isObjectEmpty(object: any): boolean {
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
  private usersLink: { [key: string]: { listener: Listener, channels: string[] } } = {};
  private channelsUsers: { [key: string]: { len: number, [key: string]: string | number } } = {};

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
}

// Tests

console.log('Start testing "Registration and Subscribing"');

const pubSubEngine: PubSubEngine = new PubSubEngine();

const shifting: number = 50;
const numberOfUsers: number = 30000;
const numberOfChannelsPerUser: number = 1000;

console.time('Registration and Subscribing');

let shiftSubscribe: number = 0;
for (let i: number = 0; i < numberOfUsers; i++) {
  pubSubEngine.register(`my_user_number_${i}`, (mgs: any): void => {
    // TODO: write throughput tests
  });

  const channels: any[] = [];
  for (let j: number = 0 + shiftSubscribe; j < numberOfChannelsPerUser + shiftSubscribe; j++) {
    channels.push(`one_of_the_subscribed_channels_${j}`);
  }
  pubSubEngine.subscribe(`my_user_number_${i}`, channels);
  shiftSubscribe = shiftSubscribe + shifting;
}

console.log(pubSubEngine.getStats());
console.timeEnd('Registration and Subscribing');


console.log('Start testing "Unregister"');
console.time('Unregister');

for (let i: number = 0; i < numberOfUsers; i++) {
  pubSubEngine.unregister(`my_user_number_${i}`);
}

console.log(pubSubEngine.getStats());
console.timeEnd('Unregister');

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

setInterval(() => {
  // handle stuff here
}, 100000);