import { WebsocketEngine, WebSocket, WSEngine } from '../engine';

function noop(): void { /** noop function */ }

interface BrokerClientOptions {
  url: string;
  engine: WSEngine;
  onMessage?: (message: string) => void;
  onRegister?: () => void;
  // TODO: find out how to handle unregister
  onUnregister?: (err?: Error) => void;
}

export class BrokerClient {
  private socket: WebSocket;
  private inReconnect: boolean;

  constructor(private config: BrokerClientOptions) {
    this.connect();
  }

  public send(message: string): void {
    this.socket.send(message);
  }

  private connect(): void {
    this.socket = new WebsocketEngine(this.config.engine)
      .createClient(this.config.url);

    this.socket.on('open', this.config.onRegister || noop);
    this.socket.on('message', this.config.onMessage || noop);

    this.socket.on('error', (err: Error) => {
      this.reconnect();
    });

    this.socket.on('close', (code?: number, reason?: string) => {
      this.reconnect();
    });

    this.socket.on('ping', () => {
      // TODO: keep track if server still alive
    });
  }

  private reconnect(): void {
    if (!this.inReconnect) {
      this.inReconnect = true;
      if (this.config.onUnregister) {
        this.config.onUnregister();
      }

      setTimeout(() => {
        this.inReconnect = false;
        this.connect();
      }, Math.floor(Math.random() * 2000) + 200);
    }
  }
}