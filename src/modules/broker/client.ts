import { WebsocketEngine, WebSocket } from '../engine';

export class BrokerClient {
  private socket: WebSocket;

  constructor(private config: { url: string, engine: string }) {
    this.socket = new WebsocketEngine(this.config.engine).createClient(config.url);

    this.socket.on('open', () => {
      // write on open
    });

    this.socket.on('message', (message: string) => {
      // write on message handler
    });

    this.socket.on('error', (err: Error) => {
      // write logic for error handling
    });

    this.socket.on('close', (code?: number, reason?: string) => {
      // write on close logic
    });

    this.socket.on('ping', () => {
      // confirm that server still running
    });
  }
}