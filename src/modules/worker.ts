import * as HTTP from 'http';
import * as HTTPS from 'https';

import { Socket } from './socket/socket';
import { WSServer } from './socket/wsserver';
import { Options, Mode, Middleware } from '../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo, Listener } from '@clusterws/cws';

export class Worker {
  public wss: WSServer;
  public server: HTTP.Server | HTTPS.Server;

  constructor(public options: Options, securityKey: string) {
    this.wss = new WSServer(this.options, securityKey);
    this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();

    const uServer: WebSocketServer = new WebSocketServer({
      path: this.options.wsPath,
      server: this.server,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {
        return this.wss.middleware[Middleware.verifyConnection] ?
          this.wss.middleware[Middleware.verifyConnection](info, next) :
          next(true);
      }
    });

    uServer.on('connection', (socket: WebSocket) => {
      this.wss.emit('connection', new Socket(this, socket));
    });

    if (this.options.autoPing) {
      uServer.startAutoPing(this.options.pingInterval, true);
    }

    this.server.on('error', (error: Error) => {
      this.options.logger.error(`Worker ${error.stack || error}`);
      this.options.mode === Mode.Scale && process.exit();
    });

    this.server.listen(this.options.port, this.options.host, (): void => {
      this.options.worker.call(this);
      this.options.mode === Mode.Scale && process.send({ event: 'READY', pid: process.pid });
    });
  }
}