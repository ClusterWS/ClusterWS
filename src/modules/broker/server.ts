import { randomBytes } from 'crypto';
import { WebsocketEngine, WebSocketServer, WebSocket } from '../engine';

type ExtendedSocket = WebSocket & { id: string };

function generateUid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

function findIndexOf(arr: string[], value: string): number {
  for (let i: number = 0, len: number = arr.length; i < len; i++) {
    if (arr[i] === value) {
      return i;
    }
  }

  return -1;
}

export class BrokerServer {
  private server: WebSocketServer;
  private sockets: ExtendedSocket[] = [];
  private channels: { [key: string]: string[] } = {};

  private additionalMetrics: { sent: number, received: number } = {
    sent: 0,
    received: 0
  };

  constructor(private config: { port: number, engine: string, onReady: () => void, onError: (server: boolean, err: Error) => void, onMetrics?: (data: any) => void }) {
    this.scheduleMetrics();

    this.server = new WebsocketEngine(this.config.engine).createServer({ port: this.config.port }, config.onReady);

    this.server.on('error', (err: Error) => config.onError(true, err));
    this.server.on('connection', (socket: ExtendedSocket) => {
      this.registerSocket(socket);

      socket.on('message', (message: string) => {
        if (this.config.onMetrics) {
          this.additionalMetrics.received++;
        }

        // subscribe
        if (message[0] === 's') {
          return this.subscribe(socket.id, message.replace('s', '').split(','));
        }

        // unsubscribe
        if (message[0] === 'u') {
          return this.unsubscribe(socket.id, message.replace('u', '').split(','));
        }

        // rest of the messages
        try {
          this.broadcast(socket.id, JSON.parse(message));
        } catch (err) {
          config.onError(false, err);
        }
      });

      socket.on('error', (err: Error) => {
        this.unregisterSocket(socket.id);
        config.onError(false, err);
      });

      socket.on('close', (code?: number, reason?: string) => {
        this.unregisterSocket(socket.id);
      });
    });

    this.server.startAutoPing(20000);
  }

  private scheduleMetrics(): void {
    if (this.config.onMetrics) {

      // TODO: calculate cpu usage properly
      // let old: any;
      // if (old) {
      //   console.log(process.cpuUsage(old));
      //   old = process.cpuUsage();
      // } else {
      //   old = process.cpuUsage();
      // }

      const metrics: any = {
        pid: process.pid,
        timestamp: parseInt(`${new Date().getTime() / 1000}`, 10),
        connectedSockets: this.sockets.length,
        numberOfChannels: Object.keys(this.channels).length, // TODO: improve this one
        receivedPerSecond: this.additionalMetrics.received / 10,
        sentPerSecond: this.additionalMetrics.sent / 10
      };

      this.additionalMetrics.received = 0;
      this.additionalMetrics.sent = 0;

      this.config.onMetrics(metrics);

      setTimeout(() => this.scheduleMetrics(), 10000);
    }
  }

  private registerSocket(socket: ExtendedSocket): void {
    socket.id = generateUid(4);
    this.sockets.push(socket);
  }

  private unregisterSocket(id: string): void {
    for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
      const socket: ExtendedSocket = this.sockets[i];
      if (socket.id === id) {
        this.sockets.splice(i, 1);
        // TODO: add unsubscribe
        // TODO: may assign channels to each user
        break;
      }
    }
  }

  private subscribe(id: string, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const subscribedUsers: string[] | undefined = this.channels[channels[i]];
      if (!subscribedUsers) {
        this.channels[channels[i]] = [id];
        continue;
      }

      if (findIndexOf(subscribedUsers, id) === -1) {
        subscribedUsers.push(id);
      }
    }
  }

  private unsubscribe(id: string, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const subscribedUsers: string[] | undefined = this.channels[channels[i]];
      if (!subscribedUsers) {
        continue;
      }

      const userIndex: number = findIndexOf(subscribedUsers, id);
      if (userIndex !== -1) {
        subscribedUsers.splice(userIndex, 1);
        if (!subscribedUsers.length) {
          delete this.channels[channels[i]];
        }
      }
    }
  }

  private broadcast(id: string, data: object): void {
    for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
      const socket: ExtendedSocket = this.sockets[i];
      if (socket.id !== id) {
        let empty: boolean = true;
        const preparedMessage: object = {};

        for (const key in data) {
          const subscribedUsers: string[] | undefined = this.channels[key];
          if (!subscribedUsers) {
            continue;
          }

          if (findIndexOf(subscribedUsers, socket.id) !== -1) {
            empty = false;
            preparedMessage[key] = data[key];
          }
        }

        if (!empty) {
          if (this.config.onMetrics) {
            this.additionalMetrics.sent++;
          }
          socket.send(JSON.stringify(preparedMessage));
        }
      }
    }
  }
}

new BrokerServer({
  port: 3000,
  engine: 'ws',
  onMetrics: (data: any): void => {
    // metrics are submitted every 10s
    console.log(data);
  },
  onError: (isServer: boolean, err: Error): void => {
    if (isServer) {
      // do one thing
    }

    console.log('Received an error');
  },
  onReady: (): void => {
    console.log('Server is running');
  }
});