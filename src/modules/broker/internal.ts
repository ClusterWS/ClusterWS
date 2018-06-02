import { UWebSocket } from '../uws/client';
import { generateKey } from '../../utils/functions';
import { BrokerClient } from './client';
import { UWebSocketsServer } from '../uws/server';
import { Message, CustomObject } from '../../utils/types';

type Clients = {
  sockets: CustomObject;
  length: number;
  keys: string[];
};

type GlobalBrokers = {
  brokers: CustomObject;
  nextBroker: number;
  brokersKeys: string[];
  brokersAmount: number;
};

export function InternalBrokerServer(port: number, securityKey: string, horizontalScaleOptions: any): void {
  const clients: Clients = {
    sockets: {},
    length: 0,
    keys: []
  };

  const globalBrokers: GlobalBrokers = {
    brokers: {},
    nextBroker: -1,
    brokersKeys: [],
    brokersAmount: 0
  };

  const server: UWebSocketsServer = new UWebSocketsServer(
    {
      port,
      verifyClient: (info: CustomObject, done: (next: boolean) => void): void =>
        done(info.req.url === `/?token=${securityKey}`)
    },
    (): void => process.send({ event: 'READY', pid: process.pid })
  );

  server.on('connection', (socket: any): void => {
    socket.uid = generateKey(10);
    socket.channels = { '#sendToWorkers': true };
    clients.sockets[socket.uid] = socket;
    clients.length++;
    clients.keys = Object.keys(clients.sockets);

    socket.on('message', (message: Message): void => {
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
    });

    socket.on('close', (code: number, reason?: string): void => {
      delete clients.sockets[socket.uid];
      clients.length--;
      clients.keys = Object.keys(clients.sockets);
      socket = null;
    });
  });

  server.heartbeat(20000);

  if (!horizontalScaleOptions) return;

  horizontalScaleOptions.masterOptions &&
    createClient(
      `${horizontalScaleOptions.masterOptions.tlsOptions ? 'wss' : 'ws'}://127.0.0.1:${
        horizontalScaleOptions.masterOptions.port
      }/?token=${horizontalScaleOptions.key}`
    );

  for (let i: number = 0, len: number = horizontalScaleOptions.brokersUrls.length; i < len; i++)
    createClient(`${horizontalScaleOptions.brokersUrls[i]}/?token=${horizontalScaleOptions.key}`);

  function globalBroadcast(message: Message): void {
    if (globalBrokers.brokersAmount <= 0) return;

    globalBrokers.nextBroker >= globalBrokers.brokersAmount - 1
      ? (globalBrokers.nextBroker = 0)
      : globalBrokers.nextBroker++;

    const receiver: CustomObject = globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]];

    if (receiver.readyState !== 1) {
      delete globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]];
      globalBrokers.brokersKeys = Object.keys(globalBrokers.brokers);
      globalBrokers.brokersAmount--;
      return globalBroadcast(message);
    }
    receiver.send(message);
  }

  function createClient(brokerUrl: string): void {
    BrokerClient(brokerUrl, {
      broadcastMessage: broadcast,
      setBroker: (br: UWebSocket, url: string): void => {
        globalBrokers.brokers[url] = br;
        globalBrokers.brokersKeys = Object.keys(globalBrokers.brokers);
        globalBrokers.brokersAmount = globalBrokers.brokersKeys.length;

        br.send(horizontalScaleOptions.serverID);
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
