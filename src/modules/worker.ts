import * as HTTP from 'http';
import * as HTTPS from 'https';

import { Socket } from './socket/socket';
import { WSServer } from './socket/wsserver';
import { logError } from '../utils/functions';
import { Options, Listener } from '../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from 'clusterws-uws';

export class Worker {
  public wss: WSServer;
  public server: HTTP.Server | HTTPS.Server;

  constructor(public options: Options) {
    this.wss = new WSServer(this.options);
    this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();

    const uServer: WebSocketServer = new WebSocketServer({
      server: this.server,
      // need to add midleware to handle this fanction
      verifyClient: (info: ConnectionInfo, next: Listener): void => {/** Need to add logic */ }
    });

    uServer.on('connection', (socket: WebSocket) => {
      this.wss.emit('connection', new Socket(this, socket));
    });

    uServer.startAutoPing(this.options.pingInterval, true);

    this.server.on('error', (error: Error) => {
      logError(`${error.stack || error}`);
      process.exit();
    });

    this.server.listen(this.options.port, this.options.host, (): void => {
      this.options.worker.call(this);
      process.send({ event: 'READY', pid: process.pid });
    });
  }
}