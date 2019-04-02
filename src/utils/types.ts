import { SecureContextOptions } from 'tls';

// TODO: get rid of some options which wont be included in 4.0.0
// TODO: Manually write d.ts file (as generated on is trash)

// for SocketMessage use string | Buffer
export type Message = any;
export type Listener = (...args: any[]) => void;
export type WorkerFunction = () => void;

export enum Mode {
  Scale,
  SingleProcess
}

export enum Middleware {
  onSubscribe,
  onUnsubscribe,
  verifyConnection,
  onChannelOpen,
  onChannelClose
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
  mode?: Mode,
  port?: number;
  host?: string;
  logger?: Logger
  wsPath?: string;
  workers?: number;
  brokers?: number;
  autoPing?: boolean;
  logLevel?: LogLevel;
  // useBinary?: boolean;
  tlsOptions?: SecureContextOptions;
  pingInterval?: number;
  brokersPorts?: number[];
  restartWorkerOnFail?: boolean;
  horizontalScaleOptions?: HorizontalScaleOptions;
};

export type Options = {
  worker: WorkerFunction;
  mode: Mode,
  port: number;
  host: string | null;
  logger: Logger
  wsPath: string;
  workers: number;
  brokers: number;
  autoPing: boolean;
  // useBinary: boolean;
  brokersPorts: number[];
  tlsOptions: SecureContextOptions | null;
  pingInterval: number;
  restartWorkerOnFail: boolean;
  horizontalScaleOptions: HorizontalScaleOptions | null;
};

export enum LogLevel {
  ALL = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

export type Logger = {
  [keys: string]: any,
  info: (...args: any[]) => any;
  error: (...args: any[]) => any;
  debug: (...args: any[]) => any;
  warning: (...args: any[]) => any;
};
