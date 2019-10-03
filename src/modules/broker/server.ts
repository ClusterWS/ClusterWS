import { unlinkSync } from 'fs';
import { Networking } from './networking';
import { randomBytes } from 'crypto';
import { createServer, Server, Socket } from 'net';

// TODO: find out why it can not keep more then 2 instances with proper delay ???
// find out what is problem with time ???
// check with extended memory
// try uws

type ExtendedSocket = Socket & { id: string, networking: Networking };

function generateUid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

function findIndexOf(arr: string[], value: string): number {
  for (let i: number = 0, len: number = arr.length; i < len; i++) {
    if (arr[i] === value) {
      return i;
    }
  }

  return -1;
}

export class BrokerServer {
  private server: Server;
  private sockets: ExtendedSocket[] = [];
  private channels: { [key: string]: string[] } = {};
  private iters: number = 0;

  constructor(config: { path?: string, host?: string, port?: number }, readyListener: (err?: Error) => void) {

    setInterval(() => {
      console.log('Iters for 5s', this.iters);
      this.iters = 0;
    }, 5000);

    if (!config.port && config.path) {
      try { unlinkSync(config.path); } catch (err) {
        if (err.code !== 'ENOENT') {
          return readyListener(err) as undefined;
        }
      }

      if (process.platform === 'win32') {
        // TODO: make sure system can run on windows properly
        config.path = config.path.replace(/^\//, '');
        config.path = config.path.replace(/\//g, '-');
        config.path = `\\\\.\\pipe\\${config.path}`;
      }
    }

    this.server = createServer((socket: ExtendedSocket) => {
      this.registerSocket(socket);

      socket.networking.onMessage((message: string) => {
        this.iters++;
        if (message[0] === 's') {
          // subscribe
          return this.subscribe(socket.id, message.replace('s', '').split(','));
        }

        if (message[0] === 'u') {
          // unsubscribe
          return this.unsubscribe(socket.id, message.replace('u', '').split(','));
        }

        try {
          this.broadcast(socket.id, JSON.parse(message));
        } catch (err) {
          // TODO: write decode error message
          console.log(err);
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

    this.server.on('error', readyListener);
    this.server.listen(config, readyListener);
  }

  private registerSocket(socket: ExtendedSocket): void {
    socket.id = generateUid(4);
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

  private subscribe(id: string, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const subscribedUsers: string[] | undefined = this.channels[channels[i]];
      if (!subscribedUsers) {
        this.channels[channels[i]] = [id];
        continue;
      }

      if (findIndexOf(subscribedUsers, id) === -1) {
        subscribedUsers.push(id);
      }
    }
  }

  private unsubscribe(id: string, channels: string[]): void {
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const subscribedUsers: string[] | undefined = this.channels[channels[i]];
      if (!subscribedUsers) {
        continue;
      }

      const userIndex: number = findIndexOf(subscribedUsers, id);
      if (userIndex !== -1) {
        subscribedUsers.splice(userIndex, 1);
        if (!subscribedUsers.length) {
          delete this.channels[channels[i]];
        }
      }
    }
  }

  private broadcast(id: string, data: object): void {
    for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
      const socket: ExtendedSocket = this.sockets[i];
      if (socket.id !== id) {
        let empty: boolean = true;
        const preparedMessage: object = {};

        for (const key in data) {
          const subscribedUsers: string[] | undefined = this.channels[key];
          if (!subscribedUsers) {
            continue;
          }

          if (findIndexOf(subscribedUsers, socket.id) !== -1) {
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

// import { fork, isMaster } from 'cluster';
// if (isMaster) {
//   for (let i = 0; i < 5; i++) {
//     fork();
//   }
// } else {
new BrokerServer({ path: './socket.unix' }, (err?: Error): void => {
  console.log(err);
  console.log('Server is running');
});
// }