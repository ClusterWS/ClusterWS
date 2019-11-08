import { unlinkSync } from 'fs';
import { Networking } from '../networking/networking';
import { uuid, noop, unixPath } from '../utils';
import { Socket, Server, createServer } from 'net';

const SUBSCRIBE: number = 's'.charCodeAt(0);
const UNSUBSCRIBE: number = 'u'.charCodeAt(0);

type ExtendedSocket = Networking & { id?: string, channels?: { [key: string]: boolean }, isAlive?: boolean };

export class BrokerServer {
  private server: Server;
  private connectedClients: ExtendedSocket[] = [];

  private onClientErrorListener: (err: Error) => void = noop;
  private onServerErrorListener: (err: Error) => void = noop;

  constructor() {
    this.onServerErrorListener = (err: Error): void => { throw err; };

    this.server = createServer((rawSocket: Socket) => {
      const socket: ExtendedSocket = this.registerSocket(rawSocket);

      socket.on('message', (message: Buffer) => {
        if (message[0] === SUBSCRIBE) {
          return this.subscribe(socket, message.slice(1).toString().split(','));
        }

        if (message[0] === UNSUBSCRIBE) {
          return this.unsubscribe(socket, message.slice(1).toString().split(','));
        }

        try {
          this.broadcast(socket.id, JSON.parse(message as any));
        } catch (err) {
          this.onClientErrorListener(err);
          socket.terminate();
        }
      });

      socket.on('error', (err: Error) => {
        this.onClientErrorListener(err);
        this.unregisterSocket(socket.id);
      });

      socket.on('close', () => {
        this.unregisterSocket(socket.id);
      });

      socket.on('pong', () => {
        socket.isAlive = true;
      });
    });

    this.server.on('error', (err: Error) => {
      this.onServerErrorListener(err);
    });

    this.scheduleHeartbeat();
  }

  public onClientError(listener: (err: Error) => void): void {
    this.onClientErrorListener = listener;
  }

  public onServerError(listener: (err: Error) => void): void {
    this.onServerErrorListener = listener;
  }

  public close(cb?: () => void): void {
    this.server.close(cb);
  }

  public listen(port: number, cb?: () => void): void;
  public listen(path: string, cb?: () => void): void;
  public listen(portOrPath: string | number, cb?: () => void): void {
    if (typeof portOrPath === 'string') {
      try { unlinkSync(portOrPath); } catch (err) {
        if (err.code !== 'ENOENT') {
          this.onServerErrorListener(err);
        }
      }

      portOrPath = unixPath(portOrPath);
    }

    this.server.listen(portOrPath, cb);
  }

  private subscribe(socket: ExtendedSocket, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      if (!socket.channels[channels[i]]) {
        socket.channels[channels[i]] = true;
      }
    }
  }

  private unsubscribe(socket: ExtendedSocket, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      delete socket.channels[channels[i]];
    }
  }

  private registerSocket(rawSocket: Socket): ExtendedSocket {
    const socket: ExtendedSocket = new Networking(rawSocket);
    socket.id = uuid(4);
    socket.isAlive = true;
    socket.channels = {};
    this.connectedClients.push(socket);
    return socket;
  }

  private unregisterSocket(id: string): void {
    for (let i: number = 0, len: number = this.connectedClients.length; i < len; i++) {
      const socket: ExtendedSocket = this.connectedClients[i];
      if (socket.id === id) {
        this.connectedClients.splice(i, 1);
        break;
      }
    }
  }

  private scheduleHeartbeat(): void {
    for (let i: number = 0, len: number = this.connectedClients.length; i < len; i++) {
      const socket: ExtendedSocket = this.connectedClients[i];
      if (!socket.isAlive) {
        socket.terminate();
        this.unregisterSocket(socket.id);
        continue;
      }

      socket.isAlive = false;
      socket.ping();
    }

    // send heartbeat every 10s
    setTimeout(this.scheduleHeartbeat.bind(this), 10000);
  }

  private broadcast(id: string, data: object): void {
    for (let i: number = 0, len: number = this.connectedClients.length; i < len; i++) {
      const socket: ExtendedSocket = this.connectedClients[i];
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
          socket.send(JSON.stringify(preparedMessage));
        }
      }
    }
  }
}
