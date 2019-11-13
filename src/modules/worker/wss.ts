
import { noop, uuid } from '../utils';
import { BrokerPool } from '../broker/pool';
import { PubSubEngine } from '../pubsub/pubsub';

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { WebSocket as DefaultWebSocket, WebsocketEngine, WSEngine, WebSocketServer } from '../engine';

interface WSServerOptions {
  engine: WSEngine;
  server: HttpServer | HttpsServer;
  wsPath: string | null;
  brokersLinks: string[];
}

export interface PubSub {
  publish(channel: string, message: any): void;
  register(ws: WebSocket, listener: (message: any) => void): void;
  unregister(ws: WebSocket): void;
}

export interface WebSocket extends DefaultWebSocket {
  publish: (channel: string, message: any) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}

export class WSServer {
  public pubsub: PubSub = {
    publish: this.publish.bind(this, {}),
    register: this.register.bind(this),
    unregister: this.unregister.bind(this),
  };

  private brokerPool: BrokerPool;
  private pubSubEngine: PubSubEngine;
  private webSocketServer: WebSocketServer;
  private onConnection: (webSocket: WebSocket) => void = noop;

  constructor(private options: WSServerOptions) {
    // TODO: await both PubSubEngine and broker pool creation
    this.createPubSubEngine();
    this.createBrokerPool();

    this.webSocketServer = new WebsocketEngine(this.options.engine).createServer({
      path: this.options.wsPath,
      server: this.options.server,
      verifyClient: (info: any, next: any): void => {
        // TODO: complete writing verify function
        next(true);
      }
    });

    this.webSocketServer.on('connection', (ws: DefaultWebSocket) => {
      ws.__id = uuid(4);
      ws.publish = this.publish.bind(this, ws);
      ws.subscribe = this.subscribe.bind(this, ws);
      ws.unsubscribe = this.unsubscribe.bind(this, ws);
      this.onConnection(ws as WebSocket);
    });
  }

  public on(event: string, listener: any): void {
    if (event === 'connection') {
      this.onConnection = listener;
    }

    if (event === 'error') {
      this.webSocketServer.on(event, listener);
    }
  }

  private register(ws: WebSocket, listener: (message: any) => void): void {
    this.pubSubEngine.register(ws.__id, listener);
  }

  private unregister(ws: WebSocket): void {
    this.pubSubEngine.unregister(ws.__id);
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

  private createBrokerPool(): void {
    this.brokerPool = new BrokerPool(this.options.brokersLinks);
    this.brokerPool.sendOnEachOpen((): string => `s${this.pubSubEngine.getChannels().join(',')}`);
    this.brokerPool.onMessage((message: Buffer) => {
      // TODO: optimize this part (we don't need to look through each channel and republish)
      const parsedMessage: { [key: string]: any[] } = JSON.parse(message as any);

      for (const channel in parsedMessage) {
        const messageBatch: any[] = parsedMessage[channel];
        for (let i: number = 0, len: number = messageBatch.length; i < len; i++) {
          this.pubSubEngine.publish(channel, messageBatch[i], PubSubEngine.GLOBAL_USER);
        }
      }
    });
  }

  private createPubSubEngine(): void {
    this.pubSubEngine = new PubSubEngine();
    this.pubSubEngine.onChannelCreated((channel: string) => {
      this.brokerPool.broadcast(`s${channel}`);
    });
    this.pubSubEngine.onChannelDestroyed((channel: string) => {
      this.brokerPool.broadcast(`u${channel}`);
    });
    this.pubSubEngine.register(PubSubEngine.GLOBAL_USER, (message: any) => {
      this.brokerPool.send(JSON.stringify(message));
    });
  }
}