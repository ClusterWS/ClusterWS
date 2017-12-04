export function randomString(long: boolean = true): string {
    return long ? Math.random().toString(16).substr(2) + '-' + Math.random().toString(16).substr(2) + '-' +
        Math.random().toString(16).substr(2) + '-' + Math.random().toString(16).substr(2) + '-' +
        Math.random().toString(16).substr(2) + '-' + Math.random().toString(16).substr(2) :
        Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
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

export type TWorkerFunction = () => void
export type TSocketMessage = any
export type TListener = (...args: any[]) => void

export interface IProcessMessage {
    event: string
    data: any
}

export interface IObject {
    [propName: string]: any
}

export interface IMachineScale {
    master: boolean
    port: number
    url?: string
    securityKey?: string
}

export interface IsecureProtocolOptions {
    key: string,
    cert: string,
    ca?: any
}

export interface IOptions {
    port: number
    worker: TWorkerFunction
    workers: number
    brokerPort: number
    pingInterval: number
    restartWorkerOnFail: boolean
    useBinary: boolean
    secureProtocolOptions: IsecureProtocolOptions | false
    machineScale?: IMachineScale
}

export interface IUserOptions {
    port?: number
    worker: TWorkerFunction
    workers?: number
    brokerPort?: number
    pingInterval?: number
    restartWorkerOnFail?: boolean
    useBinary?: boolean
    secureProtocolOptions?: IsecureProtocolOptions | false
    machineScale?: IMachineScale
}