import { connect } from 'net';
import { Networking } from './networking';
import { randomBytes } from 'crypto';

interface BrokerClientOptions {
  port?: number;
  host?: string;
  path?: string;
}

function noop(): void { /** ignore */ }

function generateUid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

export class BrokerClient {
  public id: string;

  private socket: Networking;
  private inReconnect: boolean;

  private onOpenListener: () => void = noop;
  private onMessageListener: (message: Buffer) => void = noop;
  private onErrorListener: (err: Error) => void = noop;
  private onCloseListener: () => void = noop;

  constructor(private options: BrokerClientOptions) {
    this.id = generateUid(4);
    this.startClient();
  }

  public onOpen(listener: () => void): void {
    this.onOpenListener = listener;
  }

  public onMessage(listener: (message: Buffer) => void): void {
    this.onMessageListener = listener;
  }

  public onError(listener: (err: Error) => void): void {
    this.onErrorListener = listener;
  }

  public onClose(listener: () => void): void {
    this.onCloseListener = listener;
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
      this.onOpenListener();
    });

    this.socket.on('message', (message: Buffer) => {
      this.onMessageListener(message);
    });

    this.socket.on('error', (err: Error) => {
      this.onErrorListener(err);
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
      this.onCloseListener();

      setTimeout(() => {
        this.inReconnect = false;
        this.startClient();
      }, Math.floor(Math.random() * 2000) + 200);
    }
  }
}