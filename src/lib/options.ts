import {resolve} from 'path';

// Create object Options with provided data
export class Options {
    port: number;
    workers: number;
    workerPath: string;
    restartWorkerOnFail: boolean;
    id: number;
    brokerPort: number;
    pingPongInterval: number;
    // Construct an option object
    constructor(port?: number, workers?: number, workerPath?: string, restartWorkerOnFail?: boolean, brokerPort?: number, pingPongInterval?: number) {
        // Make sure that path to worker exist
        if (!workerPath) {
            throw new Error('\x1b[31mPath to the worker must be provided\x1b[0m');
        }
        // Set default params in case of no params
        this.port = port || 3000;
        this.workers = workers || 1;
        this.workerPath = resolve(workerPath);
        this.restartWorkerOnFail = restartWorkerOnFail || false;
        this.id = 0;
        this.brokerPort = brokerPort || 9346;
        this.pingPongInterval = pingPongInterval || 20000
    }
}
