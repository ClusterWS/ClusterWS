import * as HTTP from 'http';
import * as HTTPS from 'https';

import { WebSocket } from './cws/client';
import { WebSocketsServer } from './cws/server';

import { Socket } from './socket/socket';
import { WSServer } from './socket/wsserver';
import { BrokerClient } from './broker/client';
import { Options, CustomObject, Listener } from '../utils/types';

export class Worker {
  public wss: WSServer = new WSServer();
  public server: HTTP.Server | HTTPS.Server;

  constructor(public options: Options, securityKey: string) {
    for (let i: number = 0; i < this.options.brokers; i++)
      BrokerClient(`ws://127.0.0.1:${this.options.brokersPorts[i]}/?token=${securityKey}`, this.wss);

    this.server = this.options.tlsOptions ? HTTPS.createServer(this.options.tlsOptions) : HTTP.createServer();

    const uWSServer: WebSocketsServer = new WebSocketsServer({
      server: this.server,
      verifyClient: (info: CustomObject, callback: Listener): void =>
        this.wss.middleware.verifyConnection ? this.wss.middleware.verifyConnection(info, callback) : callback(true)
    });

    uWSServer.on('connection', (socket: WebSocket, upgradeReq: CustomObject) =>
      this.wss.emit('connection', new Socket(this, socket), upgradeReq)
    );

    uWSServer.heartbeat(this.options.pingInterval, true);

    this.server.listen(
      this.options.port,
      this.options.host,
      (): void => {
        this.options.worker.call(this);
        process.send({ event: 'READY', pid: process.pid });
      }
    );
  }
}
