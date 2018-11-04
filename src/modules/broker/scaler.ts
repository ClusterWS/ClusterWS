import { generateKey } from '../../utils/functions';
import { Listener, HorizontalScaleOptions } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/uws';

type SocketExtend = {
  id: string,
  serverId: string
};

export class Scaler {
  private server: WebSocketServer;
  private sockets: Array<WebSocket & SocketExtend> = [];

  constructor(private horizontalScaleOptions: HorizontalScaleOptions) {
    // add https connection
    this.server = new WebSocketServer({
      port: this.horizontalScaleOptions.masterOptions.port,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {
        next(info.req.url === `/?token=${this.horizontalScaleOptions.key}`);
      }
    }, (): void => process.send({ event: 'READY', pid: process.pid }));

    this.server.on('connection', (socket: WebSocket & SocketExtend): void => {
      socket.id = generateKey(8);
      this.sockets.push(socket);

      socket.on('message', (message: string | Buffer): void | boolean => {
        if (typeof message === 'string') {
          socket.serverId = message;
        } else if (socket.serverId) {
          for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
            const client: WebSocket & SocketExtend = this.sockets[i];
            if (socket.serverId !== client.serverId && client.readyState === client.OPEN) {
              client.send(message);
            }
          }
        }
      });

      socket.on('error', (err: Error): void => { /** ignore error */ });
      socket.on('close', (code: number, reason: string): void => {
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
}