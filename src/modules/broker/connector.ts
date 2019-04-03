// TODO: auto reconnect
// TODO: messages pre processing
import { WebSocket } from '@clusterws/cws';
import { generateUid } from '../../utils/helpers';
import { Options, Message, Listener } from '../../utils/types';

type SocketExtension = {
  id: string
};

export class BrokerConnector {
  private connections: Array<WebSocket & SocketExtension> = [];

  constructor(private options: Options, private publishFunction: Listener) {
    // this should automatically create as many connections to broker as needed
    for (let i: number = 0; i < this.options.brokers; i++) {
      // create connection to each broker
      this.createConnection(`ws://127.0.0.1:${this.options.brokersPorts[i]}`);
    }
  }

  public publish(message: Message): void {
    //  TODO: write loop to select correct publish broker
  }

  public subscribe(channel: string): void {
    // register to channel or channels
  }

  public unsubscribe(channel: string): void {
    // unregister form channel or channels
  }

  private createConnection(url: string): void {
    const socket: WebSocket & SocketExtension = new (WebSocket as any)(url);

    socket.on('open', () => {
      socket.id = generateUid(8);
      this.connections.push(socket);
      this.options.logger.debug(`Broker client ${socket.id} is connected to ${url}`);
    });

    socket.on('message', (message: Message) => {
      // we always expect to get json string
      this.options.logger.debug(`Broker client ${socket.id} received:`, message);
      message = JSON.parse(message);
      for (const key in message) {
        if (true) { // overcome typescript
          this.publishFunction(key, message, 'broker');
        }
      }
    });

    socket.on('close', (code: number, reason: string) => {
      this.options.logger.debug(`Broker client ${socket.id} is disconnected from ${url} code ${code}, reason ${reason}`);

      // this will remove connection from iteration loop
      for (let i: number = 0, len: number = this.connections.length; i < len; i++) {
        if (this.connections[i].id === socket.id) {
          this.connections.splice(i, 1);
        }
      }

      // TODO: validate what is problem and reconnect if needed
    });

    socket.on('error', (err: any) => {
      this.options.logger.debug(`Broker client ${socket.id} got error`, err);

      // TODO: validate what is problem and reconnect if needed
    });
  }

}
