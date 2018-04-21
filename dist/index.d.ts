// Generated by dts-bundle v0.7.3
// Dependencies for this module:
//   ../http
//   ../https

import * as HTTP from 'http';
import * as HTTPS from 'https';

export default class ClusterWS {
    constructor(configurations: Configurations);
}

export function BrokerClient(url: string, securityKey: string, broadcaster: CustomObject, tries?: number, reconnected?: boolean): void;

export function BrokerServer(port: number, securityKey: string, horizontalScaleOptions: HorizontalScaleOptions | false, serverType: string): void;

export class EventEmitterMany {
    onMany(event: string, listener: (event: string, ...args: any[]) => void): void;
    emitMany(event: string, ...args: any[]): void;
    removeListener(event: string, listener: Listener): any;
    exist(event: string): boolean;
}

export class EventEmitterSingle {
    on(event: 'connection', listener: (socket: Socket) => void): void;
    on(event: string, listener: Listener): void;
    emit(event: string, message: Message): void;
    emit(event: string, ...args: any[]): void;
    removeEvents(): void;
}

export function encode(event: string, data: Message, eventType: string): string;
export function decode(socket: Socket, message: Message): void;

export class Socket {
    worker: Worker;
    events: EventEmitterSingle;
    channels: CustomObject;
    onPublishEvent: (...args: any[]) => void;
    constructor(worker: Worker, socket: WebSocket);
    on(event: 'error', listener: (err: Error) => void): void;
    on(event: 'disconnect', listener: (code?: number, reason?: string) => void): void;
    on(event: string, listener: Listener): void;
    send(event: string, message: Message, eventType?: string): void;
    disconnect(code?: number, reason?: string): void;
    terminate(): void;
}

export class WSServer extends EventEmitterSingle {
    channels: EventEmitterMany;
    middleware: CustomObject;
    setMiddleware(name: 'onPublish', listener: (channel: string, message: Message) => void): void;
    setMiddleware(name: 'onSubscribe', listener: (socket: Socket, channel: string, next: Listener) => void): void;
    setMiddleware(name: 'verifyConnection', listener: (info: CustomObject, next: Listener) => void): void;
    setMiddleware(name: 'onMessageFromWorker', listener: (message: Message) => void): void;
    publishToWorkers(message: Message): void;
    publish(channel: string, message: Message, tries?: number): void;
    broadcastMessage(_: string, message: Message): void;
    setBroker(br: WebSocket, url: string): void;
}

export class WebSocket {
    OPEN: number;
    CLOSED: number;
    isAlive: boolean;
    external: CustomObject;
    executeOn: string;
    onping: Listener;
    onpong: Listener;
    internalOnOpen: Listener;
    internalOnError: Listener;
    internalOnClose: Listener;
    internalOnMessage: Listener;
    constructor(uri: string, external?: CustomObject, isServeClient?: boolean);
    readonly readyState: number;
    on(eventName: string, listener: Listener): this;
    ping(message?: Message): void;
    send(message: Message, options?: CustomObject): void;
    terminate(): void;
    close(code: number, reason: string): void;
}

export class WebSocketServer extends EventEmitterSingle {
    noDelay: boolean;
    upgradeReq: any;
    httpServer: HTTP.Server;
    serverGroup: any;
    pingIsAppLevel: boolean;
    upgradeCallback: any;
    lastUpgradeListener: boolean;
    constructor(options: CustomObject, callback?: Listener);
    heartbeat(interval: number, appLevel?: boolean): void;
}

export const noop: any;
export const native: any;
export const OPCODE_TEXT: number;
export const OPCODE_PING: number;
export const OPCODE_BINARY: number;
export const APP_PONG_CODE: number;
export const APP_PING_CODE: any;
export const PERMESSAGE_DEFLATE: number;
export const DEFAULT_PAYLOAD_LIMIT: number;

export class Worker {
    wss: WSServer;
    server: HTTP.Server | HTTPS.Server;
    options: Options;
    constructor(options: Options, securityKey: string);
}

export function logError<T>(data: T): any;
export function logReady<T>(data: T): any;
export function logWarning<T>(data: T): any;
export function generateKey(length: number): string;

export type Message = any;
export type Listener = (...args: any[]) => void;
export type WorkerFunction = () => void;
export type CustomObject = {
    [propName: string]: any;
};
export type TlsOptions = {
    ca?: string;
    pfx?: string;
    key?: string;
    cert?: string;
    passphrase?: string;
};
export type HorizontalScaleOptions = {
    masterOptions?: {
        port: number;
        tlsOptions?: TlsOptions;
    };
    brokersUrls?: string[];
    key?: string;
};
export type Configurations = {
    worker: WorkerFunction;
    port?: number;
    host?: string;
    workers?: number;
    brokers?: number;
    useBinary?: boolean;
    brokersPorts?: number[];
    tlsOptions?: TlsOptions;
    pingInterval?: number;
    restartWorkerOnFail?: boolean;
    horizontalScaleOptions?: HorizontalScaleOptions;
    encodeDecodeEngine?: EncodeDecodeEngine;
};
export type Options = {
    worker: WorkerFunction;
    port: number;
    host: string;
    workers: number;
    brokers: number;
    useBinary: boolean;
    brokersPorts: number[];
    tlsOptions: TlsOptions | false;
    pingInterval: number;
    restartWorkerOnFail: boolean;
    horizontalScaleOptions: HorizontalScaleOptions | false;
    encodeDecodeEngine: EncodeDecodeEngine | false;
};
export type EncodeDecodeEngine = {
    encode: (message: Message) => Message;
    decode: (message: Message) => Message;
};

