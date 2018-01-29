import * as crypto from 'crypto'

export function logError<T>(data: T): any {
    return console.log('\x1b[31m%s\x1b[0m', data)
}

export function logReady<T>(data: T): any {
    return console.log('\x1b[36m%s\x1b[0m', data)
}

export function logWarning<T>(data: T): any {
    return console.log('\x1b[33m%s\x1b[0m', data)
}

export function generateKey(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}

export type Message = any
export type Listener = (...args: any[]) => void
export type WorkerFunction = () => void

export interface CustomObject {
    [propName: string]: any
}

export interface TlsOptions {
    ca?: string
    pfx?: string
    key?: string
    cert?: string
    passphrase?: string
}

export interface HorizontalScaleOptions {
    masterPort?: number
    masterTlsOptions?: TlsOptions
    mastersUrls?: string[]
    key?: string
}

export interface Configurations {
    worker: WorkerFunction
    port?: number
    workers?: number
    brokers?: number
    useBinary?: boolean
    brokersPorts?: number[]
    tlsOptions?: TlsOptions
    pingInterval?: number
    restartWorkerOnFail?: boolean
    horizontalScaleOptions?: HorizontalScaleOptions
}

export interface Options {
    worker: WorkerFunction
    port: number
    workers: number
    brokers: number
    useBinary: boolean
    brokersPorts: number[]
    tlsOptions: TlsOptions | false
    pingInterval: number
    restartWorkerOnFail: boolean
    horizontalScaleOptions: HorizontalScaleOptions | false
}