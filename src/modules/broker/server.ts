import { generateKey, logError } from '../../utils/functions';
import { Options, Listener, Message } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/uws';

type SocketExtend = {
  id: string,
  channels: { [key: string]: number }
};

export class Broker {
  private server: WebSocketServer;
  private sockets: Array<WebSocket & SocketExtend> = [];

  constructor(private options: Options, port: number, securityKey: string) {
    this.server = new WebSocketServer({
      port,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {
        next(info.req.url === `/?token=${securityKey}`);
      }
    }, (): void => process.send({ event: 'READY', pid: process.pid }));

    this.server.on('connection', (socket: WebSocket & SocketExtend): void => {
      socket.id = generateKey(8);
      socket.channels = {};
      this.sockets.push(socket);

      socket.on('message', (message: string | Buffer): void | boolean => {
        if (typeof message === 'string') {
          const [type, data]: any = JSON.parse(message);

          if (type === 'u') {
            return delete socket.channels[data];
          }

          if (typeof data === 'string') {
            socket.channels[data] = 1;
          } else {
            for (let i: number = 0, len: number = data.length; i < len; i++) {
              socket.channels[data[i]] = 1;
            }
          }
        } else {
          this.broadcastMessage(socket.id, JSON.parse(Buffer.from(message) as any));
        }
      });

      socket.on('error', (err: Error): void => {
        // need to fix this error message
        logError(`Error in broker: ${err}`);
      });

      socket.on('close', (code: number, reason: string): void => {
        socket.channels = {};
        for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
          if (this.sockets[i].id === socket.id) {
            this.sockets.splice(i, 1);
            break;
          }
        }
        socket = null;
      });
    });

    this.server.startAutoPing(20000);
  }

  private broadcastMessage(id: string, message: Message): void {
    const messageKeys: string[] = Object.keys(message);
    for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
      const socket: WebSocket & SocketExtend = this.sockets[i];
      if (socket.id !== id) {
        let pass: boolean = false;
        const readyMessage: Message = {};

        for (let j: number = 0, keysLen: number = messageKeys.length; j < keysLen; j++) {
          const key: string = messageKeys[j];
          if (socket.channels[key]) {
            pass = true;
            readyMessage[key] = message[key];
          }
        }

        if (pass && socket.readyState === socket.OPEN) {
          socket.send(Buffer.from(JSON.stringify(readyMessage)));
        }
      }
    }
  }
}