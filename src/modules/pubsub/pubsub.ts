import { Listener, Message } from '../../utils/types';

export class PubSubEngine {
  private changes: string[] = [];
  private batches: any = {};
  private registeredUsers: any = {};
  private registeredChannels: any = {};

  constructor(private loopInterval: number) {
    // execute start
  }

  public register(userId: string, listener: Listener): void {
    this.registeredUsers[userId] = listener;
  }

  public subscribe(channel: string, userId: string): void {
    if (!this.registeredUsers[userId]) {
      return null;
    }

    if (this.registeredChannels[channel]) {
      return this.registeredChannels[channel].push(userId);
    }

    this.registeredChannels[channel] = [userId];
  }

  public unsubscribe(): void {
    // unsubscribe from the channel
  }

  public publish(channel: string, message: Message, id?: string): void {
    if (this.changes.indexOf(channel) === -1) {
      this.changes.push(channel);
    }

    const batch: any = this.batches[channel];
    if (batch) {
      return batch.push({ id, message });
    }

    this.batches[channel] = [{ id, message }];
  }

  private flush(): void {
    // execute flush for the loop
  }

  private loop(): void {
    setTimeout(() => {
      this.flush();
      this.loop();
    }, this.loopInterval);
  }
}