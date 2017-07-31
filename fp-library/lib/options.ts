let _ = require('../utils/fp')

export interface Options {
    port: number,
    worker: any,
    workers: number,
    brokerPort: number,
    pingInterval: number,
    restartWorkerOnFail: boolean
}

export function loadOptions(configurations: any) {
    if (!configurations.worker) return _.Left.of('No worker was provided')
        
    let options: Options = {
        port: configurations.port || 8080,
        worker: configurations.worker,
        workers: configurations.workers || 1,
        brokerPort: configurations.brokerPort || 9346,
        pingInterval: configurations.pingInterval || 20000,
        restartWorkerOnFail: configurations.restartWorkerOnFail || false
    }
    return _.Right.of(options)
}