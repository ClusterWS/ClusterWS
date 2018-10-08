import { Channel } from '../pubsub/channel';
import { generateKey } from '../../utils/functions';
import { Options, Listener, Message } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from '@clusterws/uws';

type SocketExtend = {
  id: string,
  channels: any
};

export class Broker {
  private server: WebSocketServer;
  private channels: { [key: string]: Channel } = {};

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
          // need to add unsubscribe
          if (!this.channels[message]) {
            const channel: Channel = new Channel(message, socket.id, this.messagePublisher.bind(null, socket));
            channel.on('publish', (chName: string, data: Message[]) => {
              // handler channel logic
            });

            channel.on('destroy', (chName: string) => {
              // handle channel destroy
            });

            this.channels[message] = channel;
          } else {
            this.channels[message].subscribe(socket.id, this.messagePublisher.bind(null, socket));
          }
        } else {
          message = Buffer.from(message);
          const index: number = message.indexOf(37);
          const channel: string = message.slice(0, index).toString();
          if (this.channels[channel]) {
            this.channels[channel].publish(socket.id, message.slice(index + 1, message.length));
          }
        }
      });

      socket.on('error', (err: Error): void => {
        // handle error
      });

      socket.on('close', (code: number, reason: string): void => {
        // add close event
      });
    });

    this.flushLoop();
    this.server.startAutoPing(20000);
  }

  private messagePublisher(socket: WebSocket, channel: string, mergedMessage: Message): void {
    socket.send(Buffer.from(`${channel}%${JSON.stringify(mergedMessage)}`));
  }

  private flushLoop(): void {
    setTimeout(() => {
      for (const channel in this.channels) {
        if (this.channels[channel]) {
          this.channels[channel].batchFlush();
        }
      }
      this.flushLoop();
    }, 10); // need to think about the timeout (should it be 5) ?
  }
}