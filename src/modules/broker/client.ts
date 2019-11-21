import { connect } from 'net';
import { Networking } from '../networking/networking';
import { uuid, noop, unixPath } from '../utils';

export class BrokerClient {
  public id: string = uuid(4);

  private socket: Networking;
  private inReconnect: boolean;

  private onOpenListener: () => void = noop;
  private onCloseListener: () => void = noop;
  private onErrorListener: (err: Error) => void = noop;
  private onMessageListener: (message: Buffer) => void = noop;

  constructor(config: { path: string });
  constructor(config: { port: number });
  constructor(config: { host: string, port: number });
  constructor(private config: { host: string, port: number, path: string }) {
    if (this.config.path) {
      this.config.path = unixPath(this.config.path);
    }

    if (this.config.port && !this.config.host) {
      this.config.host = '127.0.0.1';
    }

    this.connect();
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

  public send(message: string, cb?: () => void): void {
    this.socket.send(message, cb);
  }

  private connect(): void {
    this.socket = new Networking(connect({ ...this.config }));

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
      // TODO: keep track if server still alive
    });
  }

  private reconnect(): void {
    if (!this.inReconnect) {
      this.inReconnect = true;
      this.onCloseListener();

      setTimeout(() => {
        this.inReconnect = false;
        this.connect();
      }, Math.floor(Math.random() * 1000) + 200);
    }
  }
}