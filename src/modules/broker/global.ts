import * as HTTPS from 'https';

import { generateKey } from '../../utils/functions';
import { UWebSocketsServer } from '../uws/server';
import { Message, CustomObject, TlsOptions } from '../../utils/types';

// TODO: Implement protection from broken brokers connections
type Clients = {
  sockets: CustomObject;
  length: number;
  keys: string[];
};

export function GlobalBrokerServer(port: number, securityKey: string, tlsOptions?: TlsOptions): void {
  const clients: Clients = {
    sockets: {},
    length: 0,
    keys: []
  };

  let server: UWebSocketsServer;
  const wsOptions: CustomObject = {
    port,
    verifyClient: (info: CustomObject, done: (next: boolean) => void): void => done(info.req.url === `/?token=${securityKey}`)
  };

  if (tlsOptions) {
    const httpsServer: HTTPS.Server = HTTPS.createServer(tlsOptions);
    wsOptions.port = null;
    wsOptions.server = httpsServer;
    server = new UWebSocketsServer(wsOptions);
    httpsServer.listen(port, (): void => process.send({ event: 'READY', pid: process.pid }));
  } else server = new UWebSocketsServer(wsOptions, (): void => process.send({ event: 'READY', pid: process.pid }));

  server.on(
    'connection',
    (socket: any): void => {
      socket.on(
        'message',
        (message: Message): void => {
          if (!socket.uid && typeof message === 'string') {
            socket.uid = generateKey(10);
            socket.serverid = message;

            if (!clients.sockets[message]) {
              clients.sockets[message] = { wss: {}, next: 0, length: 0, keys: [] };
              clients.length++;
              clients.keys = Object.keys(clients.sockets);
            }

            clients.sockets[message].wss[socket.uid] = socket;
            clients.sockets[message].keys = Object.keys(clients.sockets[message].wss);
            clients.sockets[message].length++;
          } else if (socket.uid) broadcast(socket.serverid, message);
        }
      );

      socket.on(
        'close',
        (code: number, reason?: string): void => {
          if (socket.uid) {
            delete clients.sockets[socket.serverid].wss[socket.uid];
            clients.sockets[socket.serverid].keys = Object.keys(clients.sockets[socket.serverid].wss);
            clients.sockets[socket.serverid].length--;

            if (!clients.sockets[socket.serverid].length) {
              delete clients.sockets[socket.serverid];
              clients.keys = Object.keys(clients.sockets);
              clients.length--;
            }
          }
          socket = null;
        }
      );
    }
  );

  server.heartbeat(20000);

  function broadcast(serverId: string, message: Message): void {
    for (let i: number = 0; i < clients.length; i++) {
      const key: string = clients.keys[i];
      if (key !== serverId) broadcastToSingleServer(clients.sockets[key], message);
    }
  }

  function broadcastToSingleServer(singleServer: CustomObject, message: Message): void {
    if (singleServer.next >= singleServer.length) singleServer.next = 0;
    // const receiver = singleServer.wss[singleServer.keys[singleServer.next]]
    singleServer.wss[singleServer.keys[singleServer.next]].send(message);
    singleServer.next++;
  }
}
