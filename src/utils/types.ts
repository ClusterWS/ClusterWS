import * as HTTPS from 'https';

// for SocketMessage use string | Buffer
export type Message = any;
export type Listener = (...args: any[]) => void;
export type WorkerFunction = () => void;

export type HorizontalScaleOptions = {
  key?: string;
  serverId?: string;
  brokersUrls?: string[];
  masterOptions?: {
    port: number;
    tlsOptions?: HTTPS.ServerOptions;
  };
};

export type Configurations = {
  worker: WorkerFunction;
  port?: number;
  host?: string;
  workers?: number;
  brokers?: number;
  useBinary?: boolean;
  brokersPorts?: number[];
  tlsOptions?: HTTPS.ServerOptions;
  pingInterval?: number;
  restartWorkerOnFail?: boolean;
  horizontalScaleOptions?: HorizontalScaleOptions;
  encodeDecodeEngine?: EncodeDecodeEngine;
};

export type Options = {
  worker: WorkerFunction;
  port: number;
  host: string | null;
  workers: number;
  brokers: number;
  useBinary: boolean;
  brokersPorts: number[];
  tlsOptions: HTTPS.ServerOptions | null;
  pingInterval: number;
  restartWorkerOnFail: boolean;
  horizontalScaleOptions: HorizontalScaleOptions | null;
  encodeDecodeEngine: EncodeDecodeEngine | null;
};

/// TODO: Make sure that types fit
export type EncodeDecodeEngine = {
  encode: (message: Message) => Message;
  decode: (message: Message) => Message;
};

//  need to fix this
// export type Brokers = {
//   brokers: CustomObject;
//   nextBroker: number;
//   brokersKeys: string[];
//   brokersAmount: number;
// };

// export type BrokerClients = {
//   sockets: CustomObject;
//   length: number;
//   keys: string[];
// };

// Removed object

// export type CustomObject = {
//   [propName: string]: any;
// };

// export type TlsOptions = {
//   ca?: string;
//   pfx?: string;
//   key?: string;
//   cert?: string;
//   passphrase?: string;
// };