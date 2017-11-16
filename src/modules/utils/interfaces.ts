export interface IOptions {
    port: number
    worker: any
    workers: number
    brokerPort: number
    pingInterval: number
    restartOnFail: boolean
}

export interface IPassedOptions {
    port?: number
    worker: any
    workers?: number
    brokerPort?: number
    pingInterval?: number
    restartOnFail?: boolean
}

export interface IProcessMessage {
    event: string
    data: any
}