import { Worker } from '../modules/worker';
import { ClientOpts } from 'redis';
import { SecureContextOptions } from 'tls';

// for SocketMessage use string | Buffer
export type Message = any;
export type Listener = (...args: any[]) => void;
export type WorkerFunction = (this: Worker) => void;

export enum Mode {
  Scale,
  Single
}

export enum Scaler {
  Default,
  Redis
}

export enum Middleware {
  onSubscribe,
  onUnsubscribe,
  verifyConnection,
  onChannelOpen,
  onChannelClose,
  onMessageFromWorker,
  onPublishIn,
  // onPublishOut
}

export enum LogLevel {
  ALL = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

export type HorizontalScaleOptions = {
  key?: string;
  scalersUrls?: string[];
  masterOptions?: {
    port: number;
    tlsOptions?: SecureContextOptions;
  };
};

export type Configurations = {
  worker: WorkerFunction;
  mode?: Mode;
  port?: number;
  host?: string;
  tlsOptions?: SecureContextOptions;
  websocketOptions?: {
    engine?: string;
    wsPath?: string;
    autoPing?: boolean;
    pingInterval?: number;
    sendConfigurationMessage?: boolean;
  },
  loggerOptions?: {
    logger?: Logger;
    logLevel?: LogLevel;
  },
  scaleOptions?: {
    redis?: ClientOpts;
    scaler?: Scaler;
    workers?: number;
    restartOnFail?: boolean;
    default?: {
      brokers?: number;
      brokersPorts?: number[];
      horizontalScaleOptions?: HorizontalScaleOptions;
    }
  }
};

export type Options = {
  mode: Mode;
  port: number;
  host: string | null;
  logger: Logger;
  worker: WorkerFunction;
  tlsOptions: SecureContextOptions | null;
  websocketOptions: {
    engine: string;
    wsPath: string;
    autoPing: boolean;
    pingInterval: number;
    sendConfigurationMessage: boolean;
  },
  scaleOptions: {
    redis: ClientOpts | null;
    scaler: Scaler;
    workers: number;
    restartOnFail: boolean;
    default: {
      brokers: number;
      brokersPorts: number[];
      horizontalScaleOptions: HorizontalScaleOptions | null;
    }
  }
};

export type Logger = {
  [keys: string]: any,
  info?: (...args: any[]) => any;
  error?: (...args: any[]) => any;
  debug?: (...args: any[]) => any;
  warning?: (...args: any[]) => any;
  // allow to use `warn` and `warning` functions to print
  warn?: (...args: any[]) => any;
};
