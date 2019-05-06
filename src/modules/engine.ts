import { Server } from 'ws';
import { Listener } from '../utils/types';
import { WebSocket, WebSocketServer } from '@clusterws/cws';

type ExtendedServer = Server & {
  startAutoPing?: Listener
};

export type WebSocketServerType = WebSocketServer | ExtendedServer;

export class WebSocketEngine {
  public static createWebsocketClient(engine: string, options: any): any {
    // toto write websocket client
    if (engine === 'ws') {
      return new (require('ws'))(options);
    }

    return new WebSocket(options);
  }

  public static createWebsocketServer(engine: string, options: any, callback?: any): WebSocketServerType {
    if (engine === 'ws') {
      const wsServer: ExtendedServer = new (require('ws').Server)(options, callback);
      wsServer.startAutoPing = (interval: number, appLevelPing: boolean): void => {
        // write logic for auto ping
        // console.log(interval, appLevelPing);
      };

      return wsServer;
    }

    return new WebSocketServer(options, callback);
  }
}