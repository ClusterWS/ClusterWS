import * as HTTP from 'http';
import * as HTTPS from 'https';

import { Options, Listener } from '../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from 'clusterws-uws';

export class Worker {
  public wss: any; // WSServer = new WSServer();
  public server: HTTP.Server | HTTPS.Server;

  constructor(public options: Options) {
    this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();

    const uServer: WebSocketServer = new WebSocketServer({
      server: this.server,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {/** Need to add logic */ }
    });

    uServer.on('connection', (socket: WebSocket) => {
      // add on connection logic
    });

    uServer.startAutoPing(this.options.pingInterval, true);

    this.server.listen(this.options.port, this.options.host, (): void => {
      this.options.worker.call(this);
      process.send({ event: 'READY', pid: process.pid });
    });
  }
}