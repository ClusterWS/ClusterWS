
export interface Options {
    port: number
    worker: any
    workers: number
    brokerPort: number
    pingInterval: number
    restartOnFail: boolean
}

export interface UserOptions {
    port?: number
    worker: any
    workers?: number
    brokerPort?: number
    pingInterval?: number
    restartOnFail?: boolean
}

export interface ProcessMessage {
    event: string,
    data?: any
}