// TODO: auto reconnect
// TODO: messages pre processing
import { WebSocket } from '@clusterws/cws';
import { Options, Message, Listener } from '../../utils/types';

export class BrokerConnector {
  private connections: WebSocket[];

  constructor(private options: Options, publishFunction: Listener) {
    // this should automatically create as many connections to broker as needed
    this.createConnections();
  }

  public publish(message: Message): void {
    // handle publish
  }

  public subscribe(channel: string): void {
    // register to channel or channels
  }

  public unsubscribe(channel: string): void {
    // unregister form channel or channels
  }

  private createConnections(): void {
    // TODO: this should create all connection to all brokers

    // this.options.logger.debug('Connection Broker client to:');
    // write socket connection
    // this.socket = new WebSocket(this.url);
    // this.socket.on('open', (): void => {
    //   this.options.logger.debug('Broker client opened');
    //   // open
    // });

    // this.socket.on('message', (message: any): void => {
    //   // message
    //   this.options.logger.debug('Broker client received:', message);
    // });
  }

}
