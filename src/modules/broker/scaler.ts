import { Options, Listener, Message, HorizontalScaleOptions } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/uws';

export class Scaler {
  private server: WebSocketServer;

  constructor(private horizontalScaleOptions: HorizontalScaleOptions) {
    this.server = new WebSocketServer({
      port: horizontalScaleOptions.masterOptions.port,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {
        next(info.req.url === `/?token=${horizontalScaleOptions.key}`);
      }
    }, (): void => process.send({ event: 'READY', pid: process.pid }));
  }
}