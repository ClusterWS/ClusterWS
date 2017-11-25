export interface IOptions {
    port: number
    worker: any
    workers: number
    brokerPort: number
    pingInterval: number
    restartWorkerOnFail: boolean
    useBinary: boolean
    machineScale?: {
        master: boolean
        port: number
        url?: string
        externalKey?: string
    }
}

export interface IPassedOptions {
    port?: number
    worker: any
    workers?: number
    brokerPort?: number
    pingInterval?: number
    restartWorkerOnFail?: boolean
    useBinary?: boolean
    machineScale?: {
        master: boolean
        port: number
        url?: string
        externalKey?: string
    }
}

export interface IProcessMessage {
    event: string
    data: any
}