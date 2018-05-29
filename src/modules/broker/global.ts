import * as HTTPS from 'https';

import { generateKey } from '../../utils/functions';
import { UWebSocketsServer } from '../uws/server';
import { Message, CustomObject } from '../../utils/types';

// TODO: Make sure that global will not send message to the clients which are from the same server use token

type Clients = {
  sockets: CustomObject;
  length: number;
  keys: string[];
};

export function GlobalBrokerServer(port: number, securityKey: string, horizontalScaleOptions: any): void {
  const clients: Clients = {
    sockets: {},
    length: 0,
    keys: []
  };

  let server: UWebSocketsServer;

  if (horizontalScaleOptions.masterOptions && horizontalScaleOptions.masterOptions.tlsOptions) {
    const httpsServer: HTTPS.Server = HTTPS.createServer(horizontalScaleOptions.masterOptions.tlsOptions);
    server = new UWebSocketsServer({ server: httpsServer });
    httpsServer.listen(port, () => process.send({ event: 'READY', pid: process.pid }));
  } else server = new UWebSocketsServer({ port }, (): void => process.send({ event: 'READY', pid: process.pid }));

  server.on('connection', (socket: any): void => {
    socket.authTimeout = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000);

    socket.on('message', (message: Message): void => message);
    socket.on('close', (code: number, reason?: string): void => console.log());
  });

  server.heartbeat(20000);

  // function broadcast(serverId: string, message: Message): void {
  //   for (let i: number = 0; i < clients.length; i++) console.log()
  // }
}
