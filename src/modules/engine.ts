import * as WSWebsocket from 'ws';

import { Listener } from '../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/cws';

type ExtendedWSServer = WSWebsocket.Server & {
  startAutoPing?: Listener
};

export type WebSocketType = WebSocket | WSWebsocket;
export type ConnectionInfoType = ConnectionInfo;
export type WebSocketServerType = WebSocketServer | ExtendedWSServer;

export class WebSocketEngine {
  public static createWebsocketClient(engine: string, options: any): any {
    if (engine === 'ws') {
      return new (require('ws'))(options);
    }

    return new (require('@clusterws/cws')).WebSocket(options);
  }

  public static createWebsocketServer(engine: string, options: any, callback?: any): WebSocketServerType {
    if (engine === 'ws') {
      const wsServer: ExtendedWSServer = new (require('ws').Server)(options, callback);
      wsServer.startAutoPing = (interval: number, appLevelPing: boolean): void => {
        // write logic for auto ping
      };

      return wsServer;
    }

    return new (require('@clusterws/cws')).WebSocketServer(options, callback);
  }
}