
import { Worker } from './worker/worker';
import { SecureContextOptions } from 'tls';

export type ScaleOptions = {
  brokers: {
    instances: number;
    entries: { path?: string, port: number }[];
  },
  workers: {
    instances: number;
  }
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
  constructor(private options: Options) {
    // implement logic for the worker and broker start up
    new Worker(options);
  }

  private spawnWorker(): void {
    // const server: Server = new Server(this.options);
    //
  }
}