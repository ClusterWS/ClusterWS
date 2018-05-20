import { generateKey } from '../../utils/functions';
import { UWebSocketsServer } from '../uws/server';
import { Message, CustomObject } from '../../utils/types';

/* 
TODO: 
 1. fix typings for this file 
 2. Add external connection to global broker
**/

interface Clients {
  sockets: CustomObject;
  length: number;
  keys: string[];
}

export function InternalBrokerServer(port: number, securityKey: string, horizontalScaleOptions: any) {
  let clients: Clients = {
    sockets: {},
    length: 0,
    keys: []
  };

  const server: UWebSocketsServer = new UWebSocketsServer({ port }, (): void => {
    process.send({ event: 'READY', pid: process.pid });
  });

  server.on('connection', (socket: any): void => {
    socket.authTimeout = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 1000);

    socket.on('message', (message: Message): void => {
      if (message === securityKey) {
        if (socket.isAuth) return;
        clearTimeout(socket.authTimeout);
        socket.uid = generateKey(10);
        socket.isAuth = true;
        socket.channels = { '#sendToWorkers': true };
        clients.sockets[socket.uid] = socket;
        clients.length++;
        clients.keys = Object.keys(clients.sockets);
      } else if (socket.isAuth) {
        if (typeof message === 'string') {
          if (message[0] !== '[') {
            socket.channels[message] = socket.channels[message] ? false : true;
          } else {
            let channelsArray: string[] = JSON.parse(message);
            for (let i: number = 0, len = channelsArray.length; i < len; i++) {
              socket.channels[channelsArray[i]] = true;
            }
          }
        } else broadcast(socket.uid, message);
      }
    });

    socket.on('close', (code: number, reason?: string): void => {
      if (!socket.isAuth) return clearTimeout(socket.authTimeout);
      delete clients.sockets[socket.uid];
      clients.length--;
      clients.keys = Object.keys(clients.sockets);
      socket = null;
    });
  });

  server.heartbeat(20000);

  function broadcast(uid: string, message: Message): void {
    const messageBuffer = Buffer.from(message);
    const channel: string = messageBuffer.slice(0, messageBuffer.indexOf(37)).toString();
    for (let i: number = 0; i < clients.length; i++) {
      const key: string = clients.keys[i];
      if (key !== uid) {
        const client = clients.sockets[key];
        if (client.channels[channel]) client.send(message);
      }
    }
  }
}
