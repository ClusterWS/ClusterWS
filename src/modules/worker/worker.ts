import { WSServer } from './wss';
import { WSEngine } from '../engine';
import { SecureContextOptions } from 'tls';

import { Server as HttpServer, createServer as httpCreateServer } from 'http';
import { Server as HttpsServer, createServer as httpsCreateServer } from 'https';

interface WorkerOptions {
  port: number;
  host?: string;
  worker: () => void;
  engine: WSEngine;
  wsPath: string;
  tlsOptions?: SecureContextOptions;
  brokersLinks: string[];
}

export class Worker {
  public ws: WSServer;
  private server: HttpServer | HttpsServer;

  constructor(private options: WorkerOptions) {
    this.server = this.options.tlsOptions ?
      httpsCreateServer(this.options.tlsOptions) :
      httpCreateServer();

    this.ws = new WSServer({
      server: this.server,
      ...this.options
    });

    this.options.worker.call({ server: this });
  }

  public on(event: 'error', listener: (error: Error) => void): void;
  public on(event: 'request', listener: (...args: any[]) => void): void;
  public on(event: string, listener: (...args: any[]) => void): void {
    if (event === 'error') {
      return this.ws.on(event, listener);
    }

    this.server.on(event, listener);
  }

  public start(cb: () => void): void {
    this.server.listen(this.options.port, this.options.host, cb);
  }

  public stop(cb: () => void): void {
    this.server.close(cb);
  }
}
