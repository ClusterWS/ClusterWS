
import * as pino from 'pino';

import { Worker } from './worker/worker';
import { fork, isMaster } from 'cluster';
import { SecureContextOptions } from 'tls';

export type Logger = {
  info: (...args: any[]) => any;
  warn: (...args: any[]) => any;
  debug: (...args: any[]) => any;
  error: (...args: any[]) => any;
  [key: string]: any;
};

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
  logger?: Logger,
  worker: (this: Worker) => void;
  scaleOptions: ScaleOptions;
  websocketOptions: WebsocketOptions;
  tlsOptions?: SecureContextOptions;
};

export class ClusterWS {
  private options: Options;
  constructor(options: Partial<Options> & { port: number, logger?: Logger | { logLevel: string; } }) {
    let logger: Logger = pino({ formatters: { level: (label: string): { level: string } => ({ level: label }) } });

    if (
      options.logger as Logger &&
      (options.logger as Logger).info &&
      (options.logger as Logger).warn &&
      (options.logger as Logger).error &&
      (options.logger as Logger).debug) {
      logger = options.logger as Logger;
    } else if (options.logger && options.logger.logLevel) {
      logger.level = options.logger.logLevel;
    }

    // TODO: prepare default options
    // add options validation
    this.options = {
      logger,
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