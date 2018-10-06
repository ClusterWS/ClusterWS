import { Channel } from '../pubsub/channel';
import { generateKey } from '../../utils/functions';
import { Options, Listener, Message } from '../../utils/types';
import { WebSocket, WebSocketServer, ConnectionInfo } from 'clusterws-uws';

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
        next(info.req.url === `/?token=${securityKey}`);
      }
    }, (): void => process.send({ event: 'READY', pid: process.pid }));

    this.server.on('connection', (socket: WebSocket & SocketExtend): void => {
      socket.id = generateKey(10);

      socket.on('message', (message: string | Buffer): void => {
        if (typeof message === 'string') {

          // move this handler to separate function
          const handler: any = (channel: string, mergedMessage: Message): void => {
            console.log(JSON.stringify(mergedMessage));
            socket.send(Buffer.from(`${channel}%${JSON.stringify(mergedMessage)}`));
          };

          // need to add unsubscribe
          if (!this.channels[message]) {
            const channel: Channel = new Channel(message, socket.id, handler);
            this.channels[message] = channel;
          } else {
            this.channels[message].subscribe(socket.id, handler);
          }
        } else {
          // need to optimize this functions
          message = Buffer.from(message);
          const channel: string = message.slice(0, message.indexOf(37)).toString();
          if (this.channels[channel]) {
            this.channels[channel].publish(socket.id, message.slice(message.indexOf(37) + 1, message.length));
          }
          // need to pass it to the channel
        }
      });

      socket.on('error', (err: Error): void => {
        // handle error
      });

      socket.on('close', (code: number, reason: string): void => {
        // add close event
      });
    });

    this.channelsLoop();
    this.server.startAutoPing(20000);
  }

  private channelsLoop(): void {
    setTimeout(() => {
      for (const channel in this.channels) {
        if (this.channels[channel]) {
          this.channels[channel].batchFlush();
        }
      }
      this.channelsLoop();
    }, 10); // need to think about the timeout (should it be 5) ?
  }
}