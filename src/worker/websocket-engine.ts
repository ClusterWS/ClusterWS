// Very simple wrapper around 'ws' and '@clusterws/cws' modules to make their api similar
// temporary solution which will require some redesign in the future for maintenance

import { noop } from '../utils';
import { ServerConfigs, WebSocket, WebSocketServer } from '@clusterws/cws';

// TODO: get this types out without importing them from cws module
export { WebSocket, WebSocketServer };

const PING: ArrayBuffer = new Uint8Array(['9'.charCodeAt(0)]).buffer;
const PONG: ArrayBuffer = new Uint8Array(['A'.charCodeAt(0)]).buffer;

enum WSEngine {
  WS = 'ws',
  CWS = '@clusterws/cws'
}

export class WebsocketEngine {
  private engineImport: any;

  constructor(private engine: string) {
    this.engineImport = require(this.engine);
  }

  public createClient(url: string): WebSocket {
    if (this.engine === WSEngine.WS) {
      const socket: any = new this.engineImport(url);
      socket.__on = socket.on.bind(socket);
      socket.__onPing = noop;
      socket.__onMessage = noop;

      socket.on = function socketOn(event: string, listener: any): void {
        if (event === 'ping') {
          return socket.__onPing = listener;
        }

        if (event === 'message') {
          return socket.__onMessage = listener;
        }

        socket.__on(event, listener);
      };

      socket.__on('message', function onMessage(msg: any): void {
        if (msg.length === 1 && msg[0] === 57) {
          socket.send(PONG);
          return socket.__onPing();
        }
        socket.__onMessage(msg);
      });

      socket.__on('ping', function onPing(): void {
        socket.__onPing();
      });

      return socket;
    }
    return new this.engineImport.WebSocket(url);
  }

  public createServer(options: ServerConfigs, cb?: () => void): WebSocketServer {
    if (this.engine === WSEngine.WS) {
      const wsServer: any = new this.engineImport.Server(options, cb);
      wsServer.__on = wsServer.on.bind(wsServer);
      wsServer.__onConnection = noop;

      wsServer.on = function on(event: string, listener: any): void {
        if (event === 'connection') {
          return wsServer.__onConnection = listener;
        }

        wsServer.__on(event, listener);
      };

      wsServer.__on('connection', function onConnection(socket: any, req: any): void {
        socket.__on = socket.on.bind(socket);
        socket.__onPong = noop;
        socket.__onMessage = noop;
        socket.isAlive = true;

        socket.on = function socketOn(event: string, listener: any): void {
          if (event === 'pong') {
            return socket.__onPong = listener;
          }

          if (event === 'message') {
            return socket.__onMessage = listener;
          }

          socket.__on(event, listener);
        };

        socket.__on('message', function onMessage(msg: any): void {
          socket.isAlive = true;
          if (msg.length === 1 && msg[0] === 65) {
            return socket.__onPong();
          }
          socket.__onMessage(msg);
        });

        socket.__on('pong', function onPong(): void {
          socket.isAlive = true;
          socket.__onPong();
        });

        wsServer.__onConnection(socket, req);
      });

      wsServer.startAutoPing = function autoPing(interval: number, appLevel: boolean): void {
        wsServer.clients.forEach(function each(ws: any): void {
          if (ws.isAlive === false) {
            return ws.terminate();
          }

          ws.isAlive = false;

          if (appLevel) {
            return ws.send(PING);
          }

          ws.ping(noop);
        });

        setTimeout((): void => autoPing(interval, appLevel), interval);
      };

      return wsServer;
    }

    return new this.engineImport.WebSocketServer(options, cb);
  }
}