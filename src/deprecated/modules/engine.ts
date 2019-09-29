import * as WSWebsocket from 'ws';

import { Listener, Message } from '../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/cws';

type ExtendedWSServer = WSWebsocket.Server & {
  startAutoPing?: Listener,
  _on?: any,
  _connectionListener: Listener
};

const PING: any = new Uint8Array(['9'.charCodeAt(0)]).buffer;

export type WebSocketType = WebSocket | WSWebsocket;
export type ConnectionInfoType = ConnectionInfo;
export type WebSocketServerType = WebSocketServer | ExtendedWSServer;

// cws is much better then ws module in performance :)
export class WebSocketEngine {
  public static createWebsocketClient(engine: string, options: any): any {
    if (engine === 'ws') {
      return new (require('ws'))(options);
    }

    return new (require('@clusterws/cws')).WebSocket(options);
  }

  public static createWebsocketServer(engine: string, options: any, callback?: any): WebSocketServerType {
    if (engine === 'ws') {
      // TODO: this logic can be improved a lot
      // Simple wrapper around ws to make it work with clusterws server need to be reconsidered
      const noop: any = (): void => { /** */ };
      const wsServer: ExtendedWSServer = new (require('ws').Server)(options, callback);

      wsServer._on = wsServer.on.bind(wsServer);
      wsServer._connectionListener = noop;
      (wsServer as any).on = (event: string, listener: Listener): void => {
        if (event === 'connection') {
          wsServer._connectionListener = listener;
        }
        return wsServer._on(event, listener);
      };

      wsServer._on('connection', (socket: WebSocketType, req: any) => {
        (socket as any)._on = socket.on.bind(socket);
        (socket as any)._pongListener = noop;
        (socket as any)._messageListener = noop;

        socket.on = (event: string, listener: Listener): any => {
          if (event === 'pong') {
            return (socket as any)._pongListener = listener;
          }

          if (event === 'message') {
            return (socket as any)._messageListener = listener;
          }

          return (socket as any)._on(event, listener);
        };

        (socket as any)._on('message', (message: Message) => {
          if (typeof message !== 'string' && message.length === 1 && message[0] === 65) {
            (socket as any).isAlive = true;
            return (socket as any)._pongListener();
          }
          (socket as any)._messageListener(message);
        });

        (socket as any)._on('pong', () => {
          (socket as any).isAlive = true;
          (socket as any)._pongListener();
        });
      });

      wsServer.startAutoPing = (interval: number, appLevelPing: boolean): void => {
        setInterval(function ping(): void {
          (wsServer.clients as any).forEach(function each(ws: any): void {
            if (ws.isAlive === false) {
              return ws.terminate();
            }

            ws.isAlive = false;

            if (appLevelPing) {
              return ws.send(PING);
            }

            return ws.ping(noop);
          });
        }, interval);
      };

      return wsServer;
    }

    return new (require('@clusterws/cws')).WebSocketServer(options, callback);
  }
}