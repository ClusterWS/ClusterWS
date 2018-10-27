import { generateKey } from '../../utils/functions';
import { Options, Listener, Message } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/uws';

type SocketExtend = {
  id: string,
  channels: { [key: string]: number }
};

export class Broker {
  private server: WebSocketServer;
  private sockets: any[] = [];

  constructor(port: number, options: Options, securityKey: string) {
    this.server = new WebSocketServer({
      port,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {
        return next(info.req.url === `/?token=${securityKey}`);
      }
    }, (): void => process.send({ event: 'READY', pid: process.pid }));

    this.server.on('connection', (socket: WebSocket & SocketExtend): void => {
      socket.id = generateKey(10);
      socket.channels = {};

      socket.on('message', (message: string | Buffer): void | boolean => {
        if (typeof message === 'string') {
          const [type, data]: any = JSON.parse(message);

          if (type === 'u') {
            return delete socket.channels[data];
          }

          if (typeof data === 'string') {
            socket.channels[data] = 1;
          } else {
            for (let i: number = 0, len: number = data.length; i < len; i++) {
              socket.channels[data[i]] = 1;
            }
          }
        } else {
          const decodedMessage: Message = JSON.parse(message as any);
          // we need to decode message and generate different message publish for each server
          // message = Buffer.from(message);
          // const index: number = message.indexOf(37);
          // const channelName: string = message.slice(0, index).toString();
          // need to propagate message to scaler even if channel does not exist in this broker !
          // if (this.channels[channelName]) {
          //   this.channels[channelName].publish(socket.id, message.slice(index + 1, message.length));
          // }
        }
      });

      socket.on('error', (err: Error): void => {
        // handle error
      });

      socket.on('close', (code: number, reason: string): void => {
        // add close event
      });
    });

    this.server.startAutoPing(20000);
  }

  private messagePublisher(socket: WebSocket, channel: string, mergedMessage: Message): void {
    socket.send(Buffer.from(`${channel}%${JSON.stringify(mergedMessage)}`));
  }
}