import { randomBytes } from 'crypto';
import { WebsocketEngine, WebSocketServer, WebSocket, WSEngine } from '../engine';

type ExtendedSocket = WebSocket & { id: string, channels: { [key: string]: string } };

interface BrokerServerOptions {
  port: number;
  engine: WSEngine;
  onReady: () => void;
  onError: (server: boolean, err: Error) => void;
  onMetrics?: (data: any) => void;
}

function generateUid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

export class BrokerServer {
  private server: WebSocketServer;
  private sockets: ExtendedSocket[] = [];

  private additionalMetrics: { sent: number, received: number } = {
    sent: 0,
    received: 0
  };

  constructor(private config: BrokerServerOptions) {
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
          return this.subscribe(socket, message.replace('s', '').split(','));
        }

        // unsubscribe
        if (message[0] === 'u') {
          return this.unsubscribe(socket, message.replace('u', '').split(','));
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

  private registerSocket(socket: ExtendedSocket): void {
    socket.id = generateUid(4);
    socket.channels = {};
    this.sockets.push(socket);
  }

  private unregisterSocket(id: string): void {
    for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
      const socket: ExtendedSocket = this.sockets[i];
      if (socket.id === id) {
        this.sockets.splice(i, 1);
        break;
      }
    }
  }

  private subscribe(socket: ExtendedSocket, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      if (!socket.channels[channels[i]]) {
        socket.channels[channels[i]] = '1';
      }
    }
  }

  private unsubscribe(socket: ExtendedSocket, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      delete socket.channels[channels[i]];
    }
  }

  private broadcast(id: string, data: object): void {
    for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
      const socket: ExtendedSocket = this.sockets[i];
      if (socket.id !== id) {
        let empty: boolean = true;
        const preparedMessage: object = {};

        for (const key in data) {
          if (!socket.channels[key]) {
            continue;
          }

          empty = false;
          preparedMessage[key] = data[key];
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

  private scheduleMetrics(): void {
    if (this.config.onMetrics) {
      // TODO: improve metrics collection
      const metrics: any = {
        pid: process.pid,
        timestamp: parseInt(`${new Date().getTime() / 1000}`, 10),
        connectedSockets: this.sockets.length,
        // numberOfChannels: Object.keys(this.channels).length,
        receivedPerSecond: this.additionalMetrics.received / 10,
        sentPerSecond: this.additionalMetrics.sent / 10
      };

      this.additionalMetrics.received = 0;
      this.additionalMetrics.sent = 0;

      this.config.onMetrics(metrics);

      setTimeout(() => this.scheduleMetrics(), 10000);
    }
  }
}