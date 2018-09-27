import { WebSocket } from 'clusterws-uws';
import { logWarning, logReady, getRandom } from '../../utils/functions';

export class BrokerClient {
  private socket: WebSocket;
  private attempts: number = 0;

  constructor(private url: string, private broadcast: any) {
    this.createSocket();
  }

  private createSocket(): void {
    this.socket = new WebSocket(this.url);
    this.socket.on('open', (): void => {
      this.attempts = 0;

      if (this.attempts > 1) {
        logReady(`Reconnected to the Broker: ${this.url}`);
      }
      // need to set socket in the
      // this.broadcast.setBroker(this.url, this.socket);
    });

    this.socket.on('error', (_: Error): void => {
      // simple warning to notify user that broker is unavailable
      if ((this.attempts > 0 && this.attempts % 10 === 0) || this.attempts === 1) {
        logWarning(`Can not connect to the Broker: ${this.url} (reconnecting)`);
      }

      this.socket = null;
      this.attempts++;

      setTimeout(() => this.createSocket(), getRandom(1000, 2000));
    });

    this.socket.on('close', (code: number, reason: string): void => {
      this.socket = null;
      this.attempts++;

      // inform user that client has been disconnected with 1000 and do not reconnect
      if (code === 1000) {
        return logWarning(`Disconnected from Broker: ${this.url} (code ${code})`);
      }

      logWarning(`Disconnected from Broker: ${this.url} (reconnecting)`);

      setTimeout(() => this.createSocket(), getRandom(1000, 2000));
    });
  }
}