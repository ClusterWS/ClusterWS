// This file allows us easily add redis support in future which i have been planing for a while
import { WebSocket } from '@clusterws/cws';
import { Options, Message, Listener } from '../../utils/types';
import { generateUid, selectRandomBetween } from '../../utils/helpers';

type SocketExtension = {
  id: string
};

// TODO: implement await for connections before allowing to next step
export class BrokerConnector {
  private next: number = 0;
  private connections: Array<WebSocket & SocketExtension> = [];

  constructor(private options: Options, private publishFunction: Listener, private getChannels: any, key: string) {
    this.next = selectRandomBetween(0, this.options.scaleOptions.default.brokers - 1);
    // this should automatically create as many connections to broker as needed
    for (let i: number = 0; i < this.options.scaleOptions.default.brokers; i++) {
      // create connection to each broker
      this.createConnection(`ws://127.0.0.1:${this.options.scaleOptions.default.brokersPorts[i]}/?key=${key}`);
    }
  }

  public publish(message: Message): void {
    // TODO: implement retry logic (in future)
    if (this.next > this.connections.length) {
      this.next = 0;
    }

    if (this.connections[this.next]) {
      this.connections[this.next].send(JSON.stringify(message));
    }
    this.next++;
  }

  public subscribe(channel: string | string[]): void {
    if (channel && channel.length) {
      this.options.logger.debug(`Subscribing broker client to "${channel}"`, `(pid: ${process.pid})`);
      for (let i: number = 0, len: number = this.connections.length; i < len; i++) {
        this.connections[i].send(`s${typeof channel === 'string' ? channel : channel.join(',')}`);
      }
    }
  }

  public unsubscribe(channel: string | string[]): void {
    if (channel && channel.length) {
      this.options.logger.debug(`Unsubscribing broker client from "${channel}"`, `(pid: ${process.pid})`);
      for (let i: number = 0, len: number = this.connections.length; i < len; i++) {
        this.connections[i].send(`u${typeof channel === 'string' ? channel : channel.join(',')}`);
      }
    }
  }

  private createConnection(url: string): void {
    const socket: WebSocket & SocketExtension = new (WebSocket as any)(url);

    socket.on('open', () => {
      socket.id = generateUid(8);
      this.connections.push(socket);
      this.subscribe(this.getChannels());
      this.options.logger.debug(`Broker client ${socket.id} is connected to ${url}`, `(pid: ${process.pid})`);
    });

    socket.on('message', (message: Message) => {
      // we always expect to get json string
      this.options.logger.debug(`Broker client ${socket.id} received:`, message), `(pid: ${process.pid})`;
      message = JSON.parse(message);
      for (const key in message) {
        if (true) { // overcome typescript
          this.publishFunction(key, message, 'broker');
        }
      }
    });

    socket.on('close', (code: number, reason: string) => {
      this.options.logger.debug(`Broker client ${socket.id} is disconnected from ${url} code ${code}, reason ${reason}`, `(pid: ${process.pid})`);

      // this will remove connection from iteration loop
      this.removeSocketById(socket.id);

      if (code === 1000) {
        // this socket has been closed clean
        return this.options.logger.warning(`Broker client ${socket.id} has been closed clean`);
      }

      this.options.logger.warning(`Broker client ${socket.id} has been closed, now is reconnecting`);
      setTimeout(() => this.createConnection(url), selectRandomBetween(100, 1000));
    });

    socket.on('error', (err: any) => {
      // print error message to user if there are any
      this.options.logger.error(`Broker client ${socket.id} got error`, err, 'now is reconnecting', `(pid: ${process.pid})`);

      // this will remove connection from iteration loop
      this.removeSocketById(socket.id);
      setTimeout(() => this.createConnection(url), selectRandomBetween(100, 1000));
    });
  }

  private removeSocketById(socketId: string): any {
    for (let i: number = 0, len: number = this.connections.length; i < len; i++) {
      if (this.connections[i].id === socketId) {
        this.connections.splice(i, 1);
        break;
      }
    }
  }
}
