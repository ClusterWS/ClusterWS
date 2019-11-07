import { connect } from 'net';
import { Networking } from './networking';
import { randomBytes } from 'crypto';

function noop(): void { /** ignore */ }

function generateUid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

export class BrokerClient {
  public id: string = generateUid(4);

  private socket: Networking;
  private inReconnect: boolean;

  private onOpenListener: () => void = noop;
  private onCloseListener: () => void = noop;
  private onErrorListener: (err: Error) => void = noop;
  private onMessageListener: (message: Buffer) => void = noop;

  private port: number;
  private host: string;
  private path: string;

  constructor(path: string);
  constructor(hostAndPort: string);
  constructor(private hostAndPortOrPath: string) {
    const urlArray: string[] = this.hostAndPortOrPath.split(':');

    if (urlArray.length === 1 || isNaN(parseInt(urlArray[urlArray.length - 1], 10))) {
      this.path = urlArray.join(':');

      if (process.platform === 'win32') {
        // TODO: move this to utils
        // TODO: verify if works on windows
        this.path = this.path.replace(/^\//, '');
        this.path = this.path.replace(/\//g, '-');
        this.path = `\\\\.\\pipe\\${this.path}`;
      }
    } else {
      this.port = parseInt(urlArray.pop(), 10);
      this.host = urlArray.join(':');
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

  public send(message: string): void {
    this.socket.send(message);
  }

  private connect(): void {
    this.socket = new Networking(connect({
      path: this.path,
      host: this.host,
      port: this.port,
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
      }, Math.floor(Math.random() * 2000) + 200);
    }
  }
}