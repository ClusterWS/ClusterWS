import { WebSocket } from '../cws/client';
import { BrokerClient } from './client';
import { WebSocketsServer } from '../cws/server';
import { generateKey, keysOf } from '../../utils/functions';
import { Message, CustomObject, BrokerClients, Brokers } from '../../utils/types';

export function InternalBrokerServer(port: number, securityKey: string, horizontalScaleOptions: any): void {
  const clients: BrokerClients = {
    sockets: {},
    length: 0,
    keys: []
  };

  const globalBrokers: Brokers = {
    brokers: {},
    nextBroker: -1,
    brokersKeys: [],
    brokersAmount: 0
  };

  const server: WebSocketsServer = new WebSocketsServer(
    {
      port,
      verifyClient: (info: CustomObject, done: (next: boolean) => void): void =>
        done(info.req.url === `/?token=${securityKey}`)
    },
    (): void => process.send({ event: 'READY', pid: process.pid })
  );

  server.on(
    'connection',
    (socket: any): void => {
      socket.uid = generateKey(10);
      socket.channels = { '#sendToWorkers': true };
      clients.sockets[socket.uid] = socket;
      clients.length++;
      clients.keys = keysOf(clients.sockets);

      socket.on(
        'message',
        (message: Message): void => {
          if (typeof message === 'string') {
            if (message[0] !== '[') {
              socket.channels[message] = socket.channels[message] ? null : 1;
            } else {
              const channelsArray: string[] = JSON.parse(message);
              for (let i: number = 0, len: number = channelsArray.length; i < len; i++)
                socket.channels[channelsArray[i]] = true;
            }
          } else {
            broadcast(socket.uid, message);
            if (horizontalScaleOptions) globalBroadcast(message);
          }
        }
      );

      socket.on(
        'close',
        (code: number, reason?: string): void => {
          delete clients.sockets[socket.uid];
          clients.length--;
          clients.keys = keysOf(clients.sockets);
          socket = null;
        }
      );
    }
  );

  server.heartbeat(20000);

  if (!horizontalScaleOptions) return;

  horizontalScaleOptions.masterOptions &&
    createClient(
      `${horizontalScaleOptions.masterOptions.tlsOptions ? 'wss' : 'ws'}://127.0.0.1:${
      horizontalScaleOptions.masterOptions.port
      }/?token=${horizontalScaleOptions.key || ''}`
    );

  for (let i: number = 0, len: number = horizontalScaleOptions.brokersUrls.length; i < len; i++)
    createClient(`${horizontalScaleOptions.brokersUrls[i]}/?token=${horizontalScaleOptions.key || ''}`);

  function globalBroadcast(message: Message): void {
    if (globalBrokers.brokersAmount <= 0) return;
    globalBrokers.nextBroker >= globalBrokers.brokersAmount - 1
      ? (globalBrokers.nextBroker = 0)
      : globalBrokers.nextBroker++;

    const receiver: CustomObject = globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]];

    if (receiver.readyState !== 1) {
      clearBroker(globalBrokers.brokersKeys[globalBrokers.nextBroker]);
      return globalBroadcast(message);
    }
    receiver.send(message);
  }

  function clearBroker(url: string): void {
    if (!globalBrokers.brokers[url]) return;
    delete globalBrokers.brokers[url];
    globalBrokers.brokersKeys = keysOf(globalBrokers.brokers);
    globalBrokers.brokersAmount--;
  }

  function createClient(brokerUrl: string): void {
    BrokerClient(brokerUrl, {
      clearBroker,
      broadcastMessage: broadcast,
      setBroker: (br: WebSocket, url: string): void => {
        globalBrokers.brokers[url] = br;
        globalBrokers.brokersKeys = keysOf(globalBrokers.brokers);
        globalBrokers.brokersAmount = globalBrokers.brokersKeys.length;
        br.send(horizontalScaleOptions.serverId);
      }
    });
  }

  function broadcast(uid: string, message: Message): void {
    const messageBuffer: Buffer = Buffer.from(message);
    const channel: string = messageBuffer.slice(0, messageBuffer.indexOf(37)).toString();
    for (let i: number = 0; i < clients.length; i++) {
      const key: string = clients.keys[i];
      if (key !== uid) {
        const client: CustomObject = clients.sockets[key];
        if (client.channels[channel]) client.send(message);
      }
    }
  }
}
