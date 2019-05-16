import * as HTTP from 'http';
import * as HTTPS from 'https';

import { Socket } from './socket/socket';
import { WSServer } from './socket/wsserver';
import { Options, Mode, Middleware, Listener } from '../utils/types';

import { WebSocketEngine, WebSocketServerType, WebSocketType, ConnectionInfoType } from './engine';

export class Worker {
  public wss: WSServer;
  public server: HTTP.Server | HTTPS.Server;

  constructor(public options: Options, securityKey: string) {
    this.wss = new WSServer(this.options, securityKey);
    this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();

    const uServer: WebSocketServerType = WebSocketEngine.createWebsocketServer(this.options.websocketOptions.engine, {
      path: this.options.websocketOptions.wsPath,
      server: this.server,
      verifyClient: (info: ConnectionInfoType, next: Listener): void => {
        return this.wss.middleware[Middleware.verifyConnection] ?
          this.wss.middleware[Middleware.verifyConnection](info, next) :
          next(true);
      }
    });

    uServer.on('connection', (socket: WebSocketType, upgReq: HTTP.IncomingMessage) => {
      this.options.logger.debug(`New WebSocket client is connected`, `(pid: ${process.pid})`);
      this.wss.emit('connection', new Socket(this, socket), upgReq);
    });

    if (this.options.websocketOptions.autoPing) {
      uServer.startAutoPing(this.options.websocketOptions.pingInterval, true);
    }

    this.server.on('error', (error: Error) => {
      this.options.logger.error(`Worker ${error.stack || error}`);
      this.options.mode === Mode.Scale && process.exit();
    });

    this.server.listen(this.options.port, this.options.host, (): void => {
      this.options.worker.call(this as Worker);
      this.options.mode === Mode.Scale && process.send({ event: 'READY', pid: process.pid });
    });
  }
}