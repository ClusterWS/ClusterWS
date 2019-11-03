import { connect } from 'net';
import { Networking } from './networking';
import { randomBytes } from 'crypto';

interface BrokerClientOptions {
  port?: number;
  host?: string;
  path?: string;
  onOpen?: () => void;
  onError?: (err: Error) => void;
  onMessage?: (message: Buffer) => void;
  onClose?: () => void;
}

function generateUid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

export class BrokerClient {
  public id: string;

  private socket: Networking;
  private inReconnect: boolean;

  constructor(private options: BrokerClientOptions) {
    this.id = generateUid(4);
    this.startClient();
  }

  public send(message: string): void {
    this.socket.send(message);
  }

  private startClient(): void {
    this.socket = new Networking(connect({
      path: this.options.path,
      host: this.options.host,
      port: this.options.port,
    }));

    this.socket.on('open', () => {
      if (this.options.onOpen) {
        this.options.onOpen();
      }
    });

    this.socket.on('message', (message: Buffer) => {
      if (this.options.onMessage) {
        this.options.onMessage(message);
      }
    });

    this.socket.on('error', (err: Error) => {
      if (this.options.onError) {
        this.options.onError(err);
      }
      this.reconnect();
    });

    this.socket.on('close', () => {
      this.reconnect();
    });

    this.socket.on('ping', () => {
      // TODO: keep track if server is still alive
    });
  }

  private reconnect(): void {
    if (!this.inReconnect) {
      this.inReconnect = true;
      if (this.options.onClose) {
        this.options.onClose();
      }

      setTimeout(() => {
        this.inReconnect = false;
        this.startClient();
      }, Math.floor(Math.random() * 2000) + 200);
    }
  }
}