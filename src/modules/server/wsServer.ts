
import { PubSubEngine } from '../pubsub/pubsub';
export class WSServer {
  private pubSubEngine: PubSubEngine;

  constructor() {
    this.pubSubEngine = new PubSubEngine();
    // complete
  }

  public publish(channel: string, message: string): void {
    //
  }

  public register(id: string, listener: any): void {
    this.pubSubEngine.register(id, listener);
  }

  public subscribe(id: string, channel: string): void {
    // TODO: improve way we pass channels
    this.pubSubEngine.subscribe(id, [channel]);
  }

  public unsubscribe(id: string, channel: string): void {
    // TODO: improve way we pass channels
    this.pubSubEngine.unsubscribe(id, [channel]);
  }
}