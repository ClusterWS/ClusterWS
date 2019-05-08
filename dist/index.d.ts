/* tslint:disable */
import * as HTTP from 'http';
import * as HTTPS from 'https';
import * as WSWebsocket from 'ws';

import { WebSocket } from '@clusterws/cws';
import { ClientOpts } from 'redis';
import { SecureContextOptions } from 'tls';

export type Message = any;
export type Listener = (...args: any[]) => void;
export type WebSocketType = WebSocket | WSWebsocket;
export type WorkerFunction = (this: Worker) => void;

export enum Mode {
    Scale = 0,
    Single = 1
}

export enum Scaler {
    Default = 0,
    Redis = 1
}

export enum Middleware {
    onSubscribe = 0,
    onUnsubscribe = 1,
    verifyConnection = 2,
    onChannelOpen = 3,
    onChannelClose = 4,
    onMessageFromWorker = 5
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

export class ClusterWS {
    constructor(configurations: Configurations);
}


export class Socket {
    constructor(worker: Worker, socket: WebSocketType);
    readonly readyState: number;
    on(event: string, listener: Listener): void;
    send(message: string | Buffer): void;
    send(event: string, message: Message): void;
    close(code?: number, reason?: string): void;
    terminate(): void;
    processMessage(message: Message): void;
    // TODO: this events are not ready for everyone, probably add as next feature
    // subscribe(channels: string[]): void;
    // unsubscribe(channel: string): void;
}

export class WSServer extends EventEmitter {
    middleware: {
        [s: number]: Listener;
    };
    constructor(options: Options, securityKey: string);
    publishToWorkers(message: Message): void;
    addMiddleware(middlewareType: Middleware, listener: Listener): void;
    publish(channelName: string, message: Message, id?: string): void;
    subscribe(id: string, channelName: string): void;
    unsubscribe(id: string, channelName: string): void;
}

export class Worker {
    options: Options;
    wss: WSServer;
    server: HTTP.Server | HTTPS.Server;
    constructor(options: Options, securityKey: string);
}

export class EventEmitter {
    constructor(logger: Logger);
    on(event: 'connection', listener: (socket: Socket) => void): void;
    on(event: string, listener: Listener): void;
    emit(event: string, message: Message): void;
    emit(event: string, ...args: any[]): void;
    exist(event: string): boolean;
    off(event: string): void;
    removeEvents(): void;
}


export type Configurations = {
    worker: WorkerFunction;
    mode?: Mode;
    port?: number;
    host?: string;
    engine?: string;
    tlsOptions?: SecureContextOptions;
    loggerOptions?: {
        logger?: Logger;
        logLevel?: LogLevel;
    };
    websocketOptions?: {
        wsPath?: string;
        autoPing?: boolean;
        pingInterval?: number;
        sendConfigurationMessage?: boolean;
    };
    scaleOptions?: {
        redis?: ClientOpts;
        scaler?: Scaler;
        workers?: number;
        restartOnFail?: boolean;
        default?: {
            brokers?: number;
            brokersPorts?: number[];
            horizontalScaleOptions?: HorizontalScaleOptions;
        };
    };
};
export type Options = {
    mode: Mode;
    port: number;
    host: string | null;
    engine: string;
    logger: Logger;
    worker: WorkerFunction;
    tlsOptions: SecureContextOptions | null;
    websocketOptions: {
        wsPath: string;
        autoPing: boolean;
        pingInterval: number;
        sendConfigurationMessage: boolean;
    };
    scaleOptions: {
        redis: ClientOpts | null;
        scaler: Scaler;
        workers: number;
        restartOnFail: boolean;
        default: {
            brokers: number;
            brokersPorts: number[];
            horizontalScaleOptions: HorizontalScaleOptions | null;
        };
    };
};

export type Logger = {
    [keys: string]: any;
    info?: (...args: any[]) => any;
    error?: (...args: any[]) => any;
    debug?: (...args: any[]) => any;
    warning?: (...args: any[]) => any;
    warn?: (...args: any[]) => any;
};