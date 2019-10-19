import { WSServer } from './wsServer';
import { WebsocketEngine } from '../engine';
import { SecureContextOptions } from 'tls';

import { Server as HttpServer, createServer as httpCreateServer } from 'http';
import { Server as HttpsServer, createServer as httpsCreateServer } from 'https';

interface ServerOptions {
  port: number;
  worker: (server: Server) => void;
  engine: WebsocketEngine;
  host?: string;
  tlsOptions?: SecureContextOptions;
}

export class Server {
  public ws: WSServer;
  protected server: HttpServer | HttpsServer;

  constructor(private options: ServerOptions) {
    this.server = this.options.tlsOptions ?
      httpsCreateServer(this.options.tlsOptions) :
      httpCreateServer();

    // TODO: add the rest of the options
    this.options.engine.createServer({
      server: this.server
    });

    // wrap ws server
    this.options.worker(this);
  }

  public on(event: string, listener: any): void {
    this.server.on(event, listener);
  }

  public close(cb?: () => void): void {
    this.server.close(cb);
  }

  public start(cb?: () => void): void {
    this.server.listen(this.options.port, this.options.host, cb);
  }
}
