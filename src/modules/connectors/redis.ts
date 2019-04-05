import { Options, Message, Listener } from '../../utils/types';

// TODO: write redis connector (in future)
export class RedisConnector {
  constructor(private options: Options, private publishFunction: Listener, private getChannels: any, key: string) { }

  public publish(message: Message): void {
    // implement
  }

  public subscribe(channel: string | string[]): void {
    // implement
  }

  public unsubscribe(channel: string | string[]): void {
    // implement
  }
}