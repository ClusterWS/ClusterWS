import { Listener, Message, Logger } from '../utils/types';

// TODO: Fix serious bug with data reference (in future)
// TODO: even if channel does not exist in this server we should still publish message to other servers by default
export class PubSubEngine {
  private hooks: { [key: string]: Listener } = {};
  private users: { [key: string]: Listener } = {};
  private batches: { [key: string]: Message[] } = {};
  private channels: { [key: string]: string[] } = {};

  constructor(private logger: Logger, private interval: number) {
    this.run();
  }

  // get all channels which this server is subscribed to
  public getChannels(): string[] {
    return Object.keys(this.channels);
  }

  public addListener(event: string, listener: Listener): void {
    this.hooks[event] = listener;
  }

  // register particular user with listener in pubSub system
  public register(userId: string, listener: Listener): void {
    this.users[userId] = listener;
  }

  // remove user from all subscribed channels (if has) and delete listener
  public unregister(userId: string, channels: string[]): void {
    this.logger.debug(`Removing ${userId} from`, channels, 'channels', `(pid: ${process.pid})`);
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      this.unsubscribe(userId, channels[i]);
    }
    delete this.users[userId];
  }

  // subscribe user to specific channel
  public subscribe(userId: string, channel: string): any {
    if (!this.users[userId]) {
      return this.logger.warning(`Trying to subscribe not existing user ${userId}`);
    }

    if (this.channels[channel]) {
      return this.channels[channel].push(userId);
    }

    if (this.hooks['channelAdd']) {
      this.hooks['channelAdd'](channel);
    }
    this.channels[channel] = ['broker', userId];
  }

  // remove unsubscribe user from specific channel
  public unsubscribe(userId: string, channel: string): void {
    const channelArray: string[] = this.channels[channel];
    if (channelArray && channelArray.length) {
      const userIndex: number = channelArray.indexOf(userId);
      if (userIndex !== -1) {
        channelArray.splice(userIndex, 1);
      }
    }

    // remove channels object if there is no more users
    if (channelArray && channelArray.length === 1) {
      if (this.hooks['channelClose']) {
        this.hooks['channelClose'](channel);
      }
      delete this.channels[channel];
    }
  }

  // publish message to specific channel (if user id is not proved them publish as anonym)
  public publish(channel: string, message: Message, userId?: string): any {
    // check if we have batch available for this channel already
    let batch: Message[] = this.batches[channel];

    if (!batch) {
      this.batches[channel] = batch = [];
    }

    if (message instanceof Array) {
      for (let i: number = 0, len: number = message.length; i < len; i++) {
        batch.push({ userId, message: message[i] });
      }
    } else {
      batch.push({ userId, message });
    }
  }

  private flush(): void {
    const preparedMessages: any = {};

    // for each key in batches (key is actual channel name)
    for (const channel in this.batches) {
      if (true) {
        // get all users for that channel
        const users: string[] = this.channels[channel];

        // make sure we actually have users for that channel
        if (users) {
          // get actual messages which were send from last iteration
          const batch: Message[] = this.batches[channel];
          const batchLen: number = batch.length;

          // for each user we need to create separate messages array
          for (let j: number = 0, userLen: number = users.length; j < userLen; j++) {
            const userId: string = users[j];
            const userSpecificMessages: any[] = [];

            // make sure we do not send message to the user if user was actual publisher
            for (let k: number = 0; k < batchLen; k++) {
              if (batch[k].userId !== userId) {
                userSpecificMessages.push(batch[k].message);
              }
            }

            // if we have messages for this user then add this channel with message to all messages
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

    // clean up all batches
    this.batches = {};

    // now send message to each user which should receive them
    for (const userId in preparedMessages) {
      if (this.users[userId]) {
        this.users[userId](preparedMessages[userId]);
      }
    }
  }

  // run pub sub engine in loop in specific interval
  private run(): void {
    setTimeout(() => {
      this.flush();
      this.run();
    }, this.interval);
  }
}