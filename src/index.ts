import { noop } from './modules/utils';
import { Server } from './modules/server/server';
import { WSEngine } from './modules/engine';
import { BrokerServer } from './modules/broker/server';
import { fork, isMaster, Worker } from 'cluster';
import { WSServer, WebSocket } from './modules/server/wss';
import { SecureContextOptions } from 'tls';

// reexport types
export { Server, WSEngine, WebSocket, WSServer };

export type WebsocketOptions = {
  path?: string;
  engine: WSEngine;
  autoPing?: boolean;
  pingInterval?: number;
};

export type ScaleOptions = {
  scaleOff?: boolean; // boot single worker on current thread
  brokers: {
    instances: number;
    entries: any; // put correct type here
  },
  workers: {
    instances: number;
  }
};

export type Options = {
  port: number;
  host?: string;
  worker: (this: Worker) => void;
  scaleOptions: ScaleOptions;
  websocketOptions: WebsocketOptions;
  tlsOptions?: SecureContextOptions // put correct type in here
};

export class ClusterWS {
  constructor(private options: Options) {

    if (options.scaleOptions.scaleOff) {
      // if scale off then just start server with no brokers
      this.options.scaleOptions.brokers.entries = [];
      return new Server(this.options) as any;
    }

    isMaster ? this.master() : this.worker();
  }

  private master(): void {
    let readyBrokers: number = 0;

    for (let i: number = 0; i < this.options.scaleOptions.brokers.instances; i++) {
      this.startBroker(i, () => {
        readyBrokers++;
        if (readyBrokers === this.options.scaleOptions.brokers.instances) {
          for (let j: number = 0; j < this.options.scaleOptions.workers.instances; j++) {
            this.startWorker(j);
          }
        }
      });
    }
  }

  private worker(): void {
    process.on('message', (message: any) => {
      if (message.action === 'START') {
        if (message.type === 'BROKER') {
          const broker: BrokerServer = new BrokerServer();

          broker.onServerError((err: Error) => {
            // TODO: add restart on broker error
            console.log(`[BROKER:ERROR:${process.pid}] ${err.stack || err.message}`);
          });

          const entry: { port: number, path: string } = this.options.scaleOptions.brokers.entries[message.id];

          broker.listen(entry.port || entry.path, () => {
            process.send({ action: 'READY' });
          });
        }

        if (message.type === 'WORKER') {
          new Server(this.options);
        }
      }
    });
    // handle each connection
  }

  private startBroker(id: number, ready: () => void = noop): void {
    const brokerFork: Worker = fork();
    brokerFork.send({ id, action: 'START', type: 'BROKER' });

    brokerFork.on('message', (message: any) => {
      if (message.action === 'READY') {
        ready();
      }
    });

    // handle error and exit
  }

  private startWorker(id: number): void {
    const workerFork: Worker = fork();
    workerFork.send({ id, action: 'START', type: 'WORKER' });

    workerFork.on('message', (message: any) => {
      // if (message.action === 'READY') { }
    });

    // handler error and exit
  }
}

/////////////////
// write validator
// port: 3000,
// host: '127.0.0.1',
// worker: worker,
// scaleOptions: {
//   scaleOff: true, // will run single instance with no brokers
//   brokers: {
//     instances: 2, // set to 0 if dont wont brokers
//     // allow to pass array of 'path' or 'host:port'
//     brokersLinks: []
//   },
//   workers: {
//     instances: 6
//   },
// },
// websocketOptions: {
//   path: '/socket',
//   engine: WSEngine.CWS, // before using WSEngine.WS install 'ws' module
//   autoPing: true,
//   pingInterval: 20000,
//   appLevelPing: true // mostly used for browser will send ping in app level requires manual set up
// },
// tlsOptions: { /** default node.js tls options */ }