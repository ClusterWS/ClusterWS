import { generateKey } from '../../utils/functions';
import { Options, Listener } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from 'clusterws-uws';

type SocketExtend = {
  id: string,
  channels: any
};

export class BrokerServer {
  private wsserver: WebSocketServer;

  constructor(port: number, options: Options, securityKey: string) {
    this.wsserver = new WebSocketServer({
      port,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {
        next(info.req.url === `/?token=${securityKey}`);
      }
    }, (): void => process.send({ event: 'READY', pid: process.pid }));

    this.wsserver.on('connection', (socket: WebSocket & SocketExtend): void => {
      socket.id = generateKey(10);
      // need to think on how to implement broadcast messages
      // socket.channels
      // need to handle connection

      // socket.on('close', )
    });
  }
}