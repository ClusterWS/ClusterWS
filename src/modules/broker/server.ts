import { unlink } from 'fs';
import { randomBytes } from 'crypto';
import { createServer, Server, Socket } from 'net';

import { Networking } from './networking';

type ExtendedSocket = Socket & { id: string, channels: string[], networking: Networking };

function generateUid(length: number): string {
  return randomBytes(length).toString('hex');
}

export class BrokerServer {
  private server: Server;
  private sockets: ExtendedSocket[] = [];

  constructor(private path: string) {
    // remove existing unix socket
    unlink(this.path, (err: any) => { /** Ignore for now */ });

    if (process.platform === 'win32') {
      // make sure system can run on windows
      this.path = this.path.replace(/^\//, '');
      this.path = this.path.replace(/\//g, '-');
      this.path = `\\\\.\\pipe\\${this.path}`;
    }

    this.server = createServer((socket: ExtendedSocket) => {
      socket.setNoDelay(true); // consider if we need it
      this.registerSocket(socket);

      socket.networking.onMessage((message: string) => {

        socket.networking.send(message);
      });

      socket.on('error', () => {
        // write logic
      });

      socket.on('end', () => {
        // write logic
      });
    });

    this.server.listen(this.path, () => {
      // TODO: handle creation error
    });
  }

  private registerSocket(socket: ExtendedSocket): void {
    socket.id = generateUid(8);
    socket.channels = [];
    socket.networking = new Networking(socket);

    this.sockets.push(socket);
  }

  private unregisterSocket(id: string): void {
    // remove socket
    // this.sockets.
  }
}

new BrokerServer('./socket.unix');