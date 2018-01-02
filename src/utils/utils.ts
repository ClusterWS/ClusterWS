import * as crypto from 'crypto'

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

export interface ScaleOptions {
    port: number
    url?: string
    key?: string
    master?: boolean
}

export interface Configurations {
    worker: WorkerFunction
    port?: number
    workers?: number
    useBinary?: boolean
    brokerPort?: number
    tlsOptions?: TlsOptions
    scaleOptions?: ScaleOptions
    pingInterval?: number
    restartWorkerOnFail?: boolean
}

export interface Options {
    worker: WorkerFunction
    port: number
    workers: number
    useBinary: boolean
    brokerPort: number
    tlsOptions: TlsOptions | false
    scaleOptions: ScaleOptions | false
    pingInterval: number
    restartWorkerOnFail: boolean
}

export function logError<T>(data: T): any {
    return console.log('\x1b[31m%s\x1b[0m', data)
}

export function logReady<T>(data: T): any {
    return console.log('\x1b[36m%s\x1b[0m', data)
}

export function logWarning<T>(data: T): any {
    return console.log('\x1b[33m%s\x1b[0m', data)
}

export function randomString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length)
}
