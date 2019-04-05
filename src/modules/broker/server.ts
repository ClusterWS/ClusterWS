import { generateUid } from '../../utils/helpers';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/cws';
import { Options, Listener, Message, HorizontalScaleOptions } from '../../utils/types';

// TODO: complete writing broker server
// TODO: handle fail send
// TODO: write authorization
type SocketExtend = {
  id: string,
  channels: { [key: string]: boolean }
};

export class BrokerServer {
  private server: WebSocketServer;
  private sockets: Array<WebSocket & SocketExtend> = [];

  constructor(private options: Options, port: number) {
    this.server = new WebSocketServer({ port }, (): void => {
      process.send({ event: 'READY', pid: process.pid });
    });

    this.server.on('connection', (socket: WebSocket & SocketExtend): void => {
      socket.id = generateUid(8);
      socket.channels = {};
      this.sockets.push(socket);

      this.options.logger.debug(`New connection to broker ${socket.id}`, `(pid: ${process.pid})`);

      socket.on('message', (message: Message) => {
        this.options.logger.debug(`Broker received`, message, `(pid: ${process.pid})`);
        if (message[0] === 'u') {
          const channels: string[] = message.substr(1, message.length - 1).split(',');
          for (let i: number = 0, len: number = channels.length; i < len; i++) {
            delete socket.channels[channels[i]];
          }
        } else if (message[0] === 's') {
          const channels: string[] = message.substr(1, message.length - 1).split(',');
          for (let i: number = 0, len: number = channels.length; i < len; i++) {
            socket.channels[channels[i]] = true;
          }
        } else {
          this.broadcast(socket.id, JSON.parse(message));
        }
      });

      // TODO: disconnect and error handlers are needed !
    });

    this.server.startAutoPing(20000);
  }

  private broadcast(id: string, message: any): void {
    const channels: string[] = Object.keys(message);
    const channelsLen: number = channels.length;

    for (let i: number = 0, len: number = this.sockets.length; i < len; i++) {
      const socket: WebSocket & SocketExtend = this.sockets[i];

      if (socket.id !== id) {
        let hasData: boolean = false;
        const preparedMessage: any = {};
        for (let j: number = 0; j < channelsLen; j++) {
          const channel: string = channels[j];
          if (socket.channels[channel]) {
            hasData = true;
            preparedMessage[channel] = message[channel];
          }
        }

        if (hasData) {
          socket.send(JSON.stringify(preparedMessage));
        }
      }
    }
  }
}