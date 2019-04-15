import { Worker } from '../modules/worker';
import { SecureContextOptions } from 'tls';

// TODO: get rid of some options which wont be included in 4.0.0
// TODO: Manually write d.ts file (as generated on is trash)

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
  onChannelClose
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
  serverId?: string;
  brokersUrls?: string[];
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
  tlsOptions?: SecureContextOptions | null;
  loggerOptions?: {
    logger?: Logger;
    logLevel?: LogLevel;
  }
  websocketOptions?: {
    wsPath?: string;
    autoPing?: boolean;
    pingInterval?: number;
  },
  scaleOptions?: {
    scaler?: Scaler;
    workers?: number;
    redis?: {
      // TODO: allow to pass different redis instances
      // write options for redis connection
    } | null;
    default?: {
      brokers?: number;
      brokersPorts?: number[];
      horizontalScaleOptions?: HorizontalScaleOptions
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
    wsPath: string;
    autoPing: boolean;
    pingInterval: number;
  },
  scaleOptions: {
    scaler: Scaler;
    workers: number;
    redis: {
      // TODO: allow to pass different redis instances
      // write options for redis connection
    } | null;
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
