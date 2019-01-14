import * as HTTPS from 'https';

import { WebSocketsServer } from '../cws/server';
import { generateKey, keysOf } from '../../utils/functions';
import { Message, CustomObject, HorizontalScaleOptions, BrokerClients } from '../../utils/types';

// TODO: Implement protection from broken brokers connections
export function GlobalBrokerServer(hrScale: HorizontalScaleOptions): void {
  const clients: BrokerClients = {
    sockets: {},
    length: 0,
    keys: []
  };

  let server: WebSocketsServer;
  const wsOptions: CustomObject = {
    port: hrScale.masterOptions.port,
    verifyClient: (info: CustomObject, done: (next: boolean) => void): void =>
      done(info.req.url === `/?token=${hrScale.key || ''}`)
  };

  if (hrScale.masterOptions.tlsOptions) {
    const httpsServer: HTTPS.Server = HTTPS.createServer(hrScale.masterOptions.tlsOptions);
    wsOptions.port = null;
    wsOptions.server = httpsServer;
    server = new WebSocketsServer(wsOptions);
    httpsServer.listen(hrScale.masterOptions.port, (): void => process.send({ event: 'READY', pid: process.pid }));
  } else server = new WebSocketsServer(wsOptions, (): void => process.send({ event: 'READY', pid: process.pid }));

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
              clients.keys = keysOf(clients.sockets);
            }

            clients.sockets[message].wss[socket.uid] = socket;
            clients.sockets[message].keys = keysOf(clients.sockets[message].wss);
            clients.sockets[message].length++;
          } else if (socket.uid) broadcast(socket.serverid, message);
        }
      );

      socket.on(
        'close',
        (code: number, reason?: string): void => {
          if (socket.uid) {
            delete clients.sockets[socket.serverid].wss[socket.uid];
            clients.sockets[socket.serverid].keys = keysOf(clients.sockets[socket.serverid].wss);
            clients.sockets[socket.serverid].length--;

            if (!clients.sockets[socket.serverid].length) {
              delete clients.sockets[socket.serverid];
              clients.keys = keysOf(clients.sockets);
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
