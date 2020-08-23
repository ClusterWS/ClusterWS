interface Logger {
  info: (...args: any[]) => any;
  warn: (...args: any[]) => any;
  debug: (...args: any[]) => any;
  error: (...args: any[]) => any;
  [key: string]: any;
}

interface Options {
  port: number;
  host?: string;
  logger?: Logger;
  // TODO: remove this any
  spawn: (data: any) => void;
  scaleOptions: ScaleOptions;
  websocketOptions: WebsocketOptions;
  tlsOptions?: import('tls').SecureContextOptions;
}

interface ScaleOptions {
  brokers: {
    instances: number;
    entries: { port: number, path?: string }[];
  };
  workers: {
    instances: number;
  };
  off?: boolean;
}

interface WebsocketOptions {
  path?: string;
  engine: string;
  autoPing?: boolean;
  pingInterval?: number;
}
