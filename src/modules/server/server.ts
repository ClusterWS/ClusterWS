import { Options } from '../../index';
import { WSServer } from './wss';

import { Server as HttpServer, createServer as httpCreateServer } from 'http';
import { Server as HttpsServer, createServer as httpsCreateServer } from 'https';

export class Server {
  public ws: WSServer;
  private server: HttpServer | HttpsServer;

  constructor(private options: Options) {
    this.server = this.options.tlsOptions ?
      httpsCreateServer(this.options.tlsOptions) :
      httpCreateServer();

    this.ws = new WSServer({
      server: this.server,
      ...this.options
    });

    this.ws.on('ready', () => {
      // as soon as system is ready pass work to user
      this.options.worker.call({ server: this });
    });
  }

  public on(event: 'error', listener: (error: Error) => void): void;
  public on(event: 'request', listener: (...args: any[]) => void): void;
  public on(event: string, listener: (...args: any[]) => void): void;
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
