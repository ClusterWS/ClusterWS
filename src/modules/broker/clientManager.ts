import { WebSocket } from 'clusterws-uws';

// Experementall component will be changed
export class ClientManager {
  private connectedClients: WebSocket[];
  constructor(urls: string[]) {
    // manage multipal connections

    // for (let i: number = 0; i < urls.length; i++) {
    //   // need to change this
    // }

  }

  private onMessage(message: string | Buffer): void {
    // need to get message and return it to the clients
  }
}