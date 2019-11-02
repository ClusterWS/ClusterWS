import { randomBytes } from 'crypto';
import { PubSubEngine } from '../pubsub/pubsub';
import { SecureContextOptions } from 'tls';
import { WebsocketEngine, WSEngine, WebSocket, WebSocketServer } from '../engine';

import { Server as HttpServer, createServer as httpCreateServer } from 'http';
import { Server as HttpsServer, createServer as httpsCreateServer } from 'https';

interface ServerOptions {
  port: number;
  worker: () => void;
  engine: WSEngine;
  host?: string;
  wsPath?: string;
  tlsOptions?: SecureContextOptions;
}

function noop(): void { /** ignore */ }

function generateUid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

export class Worker {
  public wss: any;
  public server: HttpServer | HttpsServer;

  private pubSubEngine: PubSubEngine;
  private onConnection: (ws: WebSocket) => void = noop;

  constructor(private options: ServerOptions) {
    this.pubSubEngine = new PubSubEngine();
    // TODO: register pub-sub engine properly with brokers
    this.server = this.options.tlsOptions ?
      httpsCreateServer(this.options.tlsOptions) :
      httpCreateServer();

    this.wss = {
      on: (event: string, listener: any): void => {
        if (event === 'connection') {
          this.onConnection = listener;
        }
      },
      pubSub: {
        publish: this.publish.bind(this, {}),
        register: this.register.bind(this),
        unregister: this.unregister.bind(this)
      }
    };

    // TODO: add the rest of the options
    const wSocketServer: WebSocketServer = new WebsocketEngine(this.options.engine).createServer({
      path: this.options.wsPath,
      server: this.server
    });

    wSocketServer.on('connection', (ws: WebSocket) => {
      // TODO: add types
      ws._id = generateUid(4);

      ws.publish = this.publish.bind(this, ws);
      ws.subscribe = this.subscribe.bind(this, ws);
      ws.unsubscribe = this.unsubscribe.bind(this, ws);

      this.onConnection(ws);
    });

    this.options.worker.call(this);
  }

  public stop(cb?: () => void): void {
    this.server.close(cb);
  }

  public start(cb?: () => void): void {
    this.server.listen(this.options.port, this.options.host, cb);
  }

  private publish(ws: WebSocket, channel: string, message: any): void {
    this.pubSubEngine.publish(channel, message, ws.__id);
  }

  private subscribe(ws: WebSocket, channel: string): void {
    this.pubSubEngine.subscribe(ws.__id, [channel]);
  }

  private unsubscribe(ws: WebSocket, channel: string): void {
    this.pubSubEngine.unsubscribe(ws.__id, [channel]);
  }

  private register(ws: WebSocket, listener: any): void {
    this.pubSubEngine.register(ws.__id, listener);
  }

  private unregister(ws: WebSocket): void {
    this.pubSubEngine.unregister(ws.__id);
  }
}
