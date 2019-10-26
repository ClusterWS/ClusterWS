import { WSServer } from './wsServer';
import { SecureContextOptions } from 'tls';
import { WebsocketEngine, WSEngine } from '../engine';

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
    this.ws = new WSServer();
    this.server = this.options.tlsOptions ?
      httpsCreateServer(this.options.tlsOptions) :
      httpCreateServer();

    // TODO: add the rest of the options
    const wSocketServer: any = this.options.engine.createServer({
      server: this.server
    });

    // wSocketServer.on('connection', (ws) => {
    //   // ws.id = 'super_cool';
    //   // this.ws.register(ws.id, (message: any) => {
    //   //   console.log(message);
    //   // });
    // });

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

// Simple server wrapper example
new Server({
  port: 3000,
  worker: (server) => {
    server.start();
    console.log('Server is running in here');

    // setTimeout(() => {
    //   server.close();
    // }, 10000);
  },
  engine: new WebsocketEngine(WSEngine.CWS)
});