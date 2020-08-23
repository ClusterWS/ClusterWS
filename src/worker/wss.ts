import { noop } from '../utils';
import { Socket } from 'net';
import { Server as HttpsServer } from 'https';
import { IncomingMessage, IncomingHttpHeaders, Server as HttpServer } from 'http';
import { WebSocket, WebsocketEngine, WebSocketServer } from './websocket-engine';

type VerifyOnUpgradeListener = (req: IncomingMessage, socket: Socket, upgradeHead: IncomingHttpHeaders, next: (value?: any) => void) => void;
type WSServerOptions = Options & {
  server: HttpServer | HttpsServer;
  onError: (err: Error) => void;
};

export class WSServer {
  private webSocketServer: WebSocketServer;

  private onConnectionListener: (ws: WebSocket, req: IncomingMessage) => void;
  private verifyConnectionOnUpgradeListener: VerifyOnUpgradeListener;

  constructor(private options: WSServerOptions) {
    this.onConnectionListener = noop;
    this.verifyConnectionOnUpgradeListener = (req, socket, upgradeHead, next): void => next();

    this.webSocketServer = new WebsocketEngine(this.options.websocketOptions.engine)
      .createServer({ noServer: true });

    this.webSocketServer.on('connection', (ws: WebSocket, req: IncomingMessage): void => {
      this.onConnectionListener(ws, req);
    });

    this.webSocketServer.on('error', (err: Error): void => {
      this.options.onError(err);
    });

    this.options.server.on('error', (err: Error): void => {
      this.options.onError(err);
    });

    this.options.server.on('upgrade', (req: IncomingMessage, socket: Socket, upgradeHead: IncomingHttpHeaders): void => {
      if (this.options.websocketOptions.path[0] !== '/') {
        this.options.websocketOptions.path = `/${this.options.websocketOptions.path}`;
      }

      if (this.options.websocketOptions.path === req.url.split('?')[0].split('#')[0]) {
        this.verifyConnectionOnUpgradeListener(req, socket, upgradeHead, (value?: any): void => {
          if (value !== undefined) {
            socket.write(`HTTP/1.1 401 Unauthorized\r\n\r\n`);
            socket.destroy();
            return;
          }

          this.webSocketServer.handleUpgrade(req, socket, upgradeHead, (ws: WebSocket): void => {
            this.webSocketServer.emit('connection', ws, req);
          });
        });
      } else {
        socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
        socket.destroy();
      }
    });
  }

  public on(event: 'connection', listener: (ws: WebSocket, req: IncomingMessage) => void): void;
  public on(event: 'connection', listener: (ws: WebSocket) => void): void;
  public on(event: 'connection', listener: (ws: WebSocket, req: IncomingMessage) => void): void {
    if (event === 'connection') {
      this.onConnectionListener = listener;
    }
  }

  public verifyConnectionOnUpgrade(listener: VerifyOnUpgradeListener): void {
    this.verifyConnectionOnUpgradeListener = listener;
  }
}
