export interface IOptions {
    port: number
    worker: any
    workers: number
    brokerPort: number
    pingInterval: number
    restartWorkerOnFail: boolean
    useBinary: boolean
}

export interface IPassedOptions {
    port?: number
    worker: any
    workers?: number
    brokerPort?: number
    pingInterval?: number
    restartWorkerOnFail?: boolean
    useBinary?: boolean
}

export interface IProcessMessage {
    event: string
    data: any
}