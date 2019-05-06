import { WebSocket, WebSocketServer } from '@clusterws/cws';

export class WebSocketEngine {
  public static createWebsocketClient(engine: string, options: any): any {
    // toto write websocket client
    if (engine === 'ws') {
      return new (require('ws'))(options);
    }

    return new WebSocket(options);
  }

  public static createWebsocketServer(engine: string, options: any, callback?: any): any {
    if (engine === 'ws') {
      const wsServer: any = new (require('ws')).Server(options, callback);
      wsServer.startAutoPing = (interval: number, appLevelPing: boolean): void => {
        // write logic for auto ping
        // console.log(interval, appLevelPing);
      };

      return wsServer;
    }

    return new WebSocketServer(options, callback);
  }
}