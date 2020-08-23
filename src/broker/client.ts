import { connect } from 'net';
import { Networking } from './networking';
import { uuid, noop } from '../utils';

export class Client {
  public id: string;

  private socket: Networking;
  private inReconnect: boolean;
  private inactivityTimeout: NodeJS.Timeout;
  private eventListeners: { [key: string]: (...args: any[]) => void };

  constructor(config: { port: number });
  constructor(config: { host: string, port: number });
  constructor(private config: { host: string, port: number, path: string }) {
    this.id = uuid(12);
    if (this.config.port && !this.config.host) {
      this.config.host = '127.0.0.1';
    }

    this.eventListeners = {
      open: noop,
      close: noop,
      message: noop,
      error: noop
    };

    this.connect();
    this.stillActive();
  }

  public on(event: 'error', listener: (err: Error) => void): void;
  public on(event: 'message', listener: (message: Buffer) => void): void;
  public on(event: 'open' | 'close', listener: () => void): void;
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventListeners[event] = listener;
  }

  public send(message: string, cb?: () => void): void {
    this.socket.send(message, cb);
  }

  private connect(): void {
    this.socket = new Networking(connect({ ...this.config }));

    this.socket.on('open', () => {
      this.stillActive();
      this.eventListeners.open();
    });

    this.socket.on('message', (message: Buffer) => {
      this.eventListeners.message(message);
    });

    this.socket.on('error', (err: Error) => {
      this.eventListeners.error(err);
      this.reconnect();
    });

    this.socket.on('close', () => {
      this.reconnect();
    });

    this.socket.on('ping', () => {
      this.stillActive();
    });
  }

  private reconnect(): void {
    if (!this.inReconnect) {
      this.inReconnect = true;
      this.eventListeners.close();

      setTimeout(() => {
        this.inReconnect = false;
        this.connect();
      }, Math.floor(Math.random() * 1000) + 200);
    }
  }

  private stillActive(): void {
    clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(() => {
      this.socket.terminate();
    }, 10000);
  }
}