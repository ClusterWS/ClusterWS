import { unlinkSync } from 'fs';
import { randomBytes } from 'crypto';
import { createServer, Server, Socket } from 'net';

import { Networking } from './networking';

type ExtendedSocket = Socket & { id: string, channels: { [key: string]: string }, networking: Networking };

function generateUid(length: number): string {
  return randomBytes(length).toString('hex');
}

export class BrokerServer {
  private server: Server;
  private sockets: ExtendedSocket[] = [];

  constructor(private path: string) {
    // TODO: support tcp
    try { unlinkSync(this.path); } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (process.platform === 'win32') {
      // TODO: make sure system can run on windows properly
      this.path = this.path.replace(/^\//, '');
      this.path = this.path.replace(/\//g, '-');
      this.path = `\\\\.\\pipe\\${this.path}`;
    }

    this.server = createServer((socket: ExtendedSocket) => {
      this.registerSocket(socket);

      socket.networking.onMessage((message: string) => {
        if (message[0] === 's') {
          // subscribe
          return this.subscribe(socket, message.replace('s', '').split(','));
        }

        if (message[0] === 'u') {
          // unsubscribe
          return this.unsubscribe(socket, message.replace('u', '').split(','));
        }

        try {
          this.broadcast(socket.id, JSON.parse(message));
        } catch (err) {
          // TODO: handle error
        }
      });

      socket.on('error', (err: Error) => {
        // TODO: log error properly
        console.log(err);
        this.unregisterSocket(socket.id);
      });

      socket.on('end', () => {
        this.unregisterSocket(socket.id);
      });
    });

    this.server.listen(this.path, () => {
      // TODO: handle creation error
    });
  }

  private registerSocket(socket: ExtendedSocket): void {
    socket.id = generateUid(8);
    socket.channels = {};
    socket.networking = new Networking(socket);

    socket.setNoDelay(true);
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
      socket.channels[channels[i]] = '1';
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
          if (socket.channels[key]) {
            empty = false;
            preparedMessage[key] = data[key];
          }
        }

        if (!empty) {
          socket.networking.send(JSON.stringify(preparedMessage));
        }
      }
    }
  }
}

new BrokerServer('./socket.unix');