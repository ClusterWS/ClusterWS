import { connect } from 'net';
import { Networking } from './networking';
import { uuid, noop } from '../utils';

export class Client {
  public id: string;

  private socket: Networking;
  private isReconnecting: boolean;
  private shouldReconnect: boolean;
  private inactivityTimeout: NodeJS.Timeout;
  private eventListeners: { [key: string]: (...args: any[]) => void };

  constructor(config: { port: number });
  constructor(config: { host: string, port: number });
  constructor(private config: { host: string, port: number }) {
    this.id = uuid(12);
    this.eventListeners = {
      open: noop,
      close: noop,
      message: noop,
      error: noop
    };

    if (this.config.port && !this.config.host) {
      this.config.host = '127.0.0.1';
    }
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

  public connect(): void {
    this.shouldReconnect = true;
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
    });

    this.socket.on('close', () => {
      this.eventListeners.close();
      if (this.shouldReconnect && !this.isReconnecting) {
        this.isReconnecting = true;

        setTimeout(() => {
          this.isReconnecting = false;
          this.connect();
        }, Math.floor(Math.random() * 1000) + 200);
      }
    });

    this.socket.on('ping', () => {
      this.stillActive();
    });

    this.stillActive();
  }

  public close(): void {
    this.shouldReconnect = false;
    this.socket.close();
    clearTimeout(this.inactivityTimeout);
  }

  private stillActive(): void {
    clearTimeout(this.inactivityTimeout);
    this.inactivityTimeout = setTimeout(() => {
      this.socket.terminate();
    }, 10000);
  }
}