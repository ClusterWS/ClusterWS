import { unlink } from 'fs';
import { createServer, Server, Socket } from 'net';

export class BrokerServer {
  private server: Server;

  constructor(private path: string) {
    // remove existing unix socket
    unlink(this.path, (err: any) => { /** Ignore for now */ });

    if (process.platform === 'win32') {
      // TODO: test on windows
      // make sure system can run on windows
      this.path = this.path.replace(/^\//, '');
      this.path = this.path.replace(/\//g, '-');
      this.path = `\\\\.\\pipe\\${this.path}`;
    }

    this.server = createServer((socket: Socket) => {
      socket.on('data', (data: any) => {
        // handle logic
        console.log(data);
      });

      socket.on('error', () => {
        // remove socket from usage
      });

      socket.on('end', () => {
        // socket has disconnected
      });
    });

    this.server.listen(this.path, () => {
      // TODO: handle creation error
      console.log('Server is listening on', this.path);
    });
  }
}

new BrokerServer('./socket.unix');