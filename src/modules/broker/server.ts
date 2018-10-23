// import { Channel } from '../pubsub/channel';
import { generateKey } from '../../utils/functions';
import { Options, Listener, Message } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/uws';

type SocketExtend = {
  id: string,
  channels: any
};

export class Broker {
  private server: WebSocketServer;
  // private channels: { [key: string]: Channel } = {};

  constructor(port: number, options: Options, securityKey: string) {
    this.server = new WebSocketServer({
      port,
      verifyClient: (info: ConnectionInfo, next: Listener): void => {
        return next(info.req.url === `/?token=${securityKey}`);
      }
    }, (): void => process.send({ event: 'READY', pid: process.pid }));

    this.server.on('connection', (socket: WebSocket & SocketExtend): void => {
      socket.id = generateKey(10);

      socket.on('message', (message: string | Buffer): void => {
        if (typeof message === 'string') {
          const [type, channelName]: string[] = JSON.parse(message);

          // if (type === 'u' && this.channels[channelName]) {
          //   return this.channels[channelName].unsubscribe(socket.id);
          // }

          // if (!this.channels[channelName]) {
          //   let channel: Channel = new Channel(channelName, socket.id, this.messagePublisher.bind(null, socket));
          //   channel.on('publish', (chName: string, data: Message[]) => {
          //     // handler channel logic
          //     // this should send message to the external scaler server
          //   });

          //   channel.on('destroy', (chName: string) => {
          //     delete this.channels[chName];
          //     channel = null;
          //   });

          //   this.channels[channelName] = channel;
          // } else {
          //   this.channels[channelName].subscribe(socket.id, this.messagePublisher.bind(null, socket));
          // }
        } else {
          message = Buffer.from(message);
          const index: number = message.indexOf(37);
          const channelName: string = message.slice(0, index).toString();
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