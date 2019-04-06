import { generateUid } from '../../utils/helpers';
import { Options, Message, Listener } from '../../utils/types';

// TODO: improve redis connector
// TODO: enable redis import only if everything is ready
// TODO: implement reconnect system
export class RedisConnector {
  private publisher: any;
  private subscriber: any;
  private publisherId: string = generateUid(8);

  constructor(private options: Options, private publishFunction: Listener, private getChannels: any, key: string) {
    this.createConnection();
  }

  public publish(message: Message): void {
    for (const channel in message) {
      if (true) {
        this.publisher.publish(channel, JSON.stringify({ publisherId: this.publisherId, message: message[channel] }));
      }
    }
  }

  public subscribe(channel: string | string[]): void {
    if (channel && channel.length) {
      this.subscriber.subscribe(channel);
    }
  }

  public unsubscribe(channel: string | string[]): void {
    if (channel && channel.length) {
      this.options.logger.debug(`Unsubscribing redis client from "${channel}"`, `(pid: ${process.pid})`);
      this.subscriber.unsubscribe(channel);
    }
  }

  private createConnection(): void {
    // we import redis only if it is needed
    const redis: any = require('redis');

    this.publisher = redis.createClient(this.options.scaleOptions.redis);
    this.subscriber = redis.createClient(this.options.scaleOptions.redis);

    this.publisher.on('ready', () => {
      this.options.logger.debug(`Redis Publisher is connected`, `(pid: ${process.pid})`);
    });

    this.publisher.on('error', (err: any) => {
      this.options.logger.error(`Redis Publisher error`, err.message, `(pid: ${process.pid})`);
    });

    this.subscriber.on('error', (err: any) => {
      this.options.logger.error(`Redis Subscriber error`, err.message, `(pid: ${process.pid})`);
    });

    this.subscriber.on('ready', () => {
      this.options.logger.debug(`Redis Subscriber is connected`, `(pid: ${process.pid})`);
    });

    this.subscriber.on('message', (channel: any, message: any) => {
      const parsedMessage: any = JSON.parse(message);
      if (parsedMessage.publisherId !== this.publisherId) {
        this.publishFunction(channel, parsedMessage.message, 'broker');
      }
    });
  }
}