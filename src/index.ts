
import { Worker } from './worker/worker';
import { fork, isMaster } from 'cluster';
import { SecureContextOptions } from 'tls';

export type ScaleOptions = {
  brokers: {
    instances: number;
    entries: { port: number, path?: string }[];
  },
  workers: {
    instances: number;
  },
  off?: boolean,
};

export type WebsocketOptions = {
  path?: string;
  engine: string;
  autoPing?: boolean;
  pingInterval?: number;
};

export type Options = {
  port: number;
  host?: string;
  worker: (this: Worker) => void;
  scaleOptions: ScaleOptions;
  websocketOptions: WebsocketOptions;
  tlsOptions?: SecureContextOptions;
};

export class ClusterWS {
  private options: Options;
  constructor(options: Options) {
    // TODO: add logger
    // TODO: prepare default options
    // add options validation
    this.options = {
      port: options.port,
      host: options.host,
      worker: options.worker,
      scaleOptions: {
        off: options.scaleOptions.off,
        workers: options.scaleOptions.workers,
        brokers: options.scaleOptions.brokers
      },
      websocketOptions: {
        path: options.websocketOptions.path || '/',
        engine: options.websocketOptions.engine,
        autoPing: options.websocketOptions.autoPing,
        pingInterval: options.websocketOptions.pingInterval || 20000
      },
      tlsOptions: options.tlsOptions
    };

    if (this.options.scaleOptions.off) {
      new Worker(this.options);
      return;
    }

    // for (let i: number = 0; i < this.options.scaleOptions.brokers.instances; i++) {
    //   // TODO: boot number of broker instances
    // }

    // TODO: first prepare brokers then boot worker
  }

  private spawnWorker(): void {
    // TODO: implement worker logic
  }

  private spawnBroker(): void {
    // TODO: implement broker logic
  }
}