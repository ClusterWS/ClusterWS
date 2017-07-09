import {fork} from 'child_process';
import {ProcessMessages} from './lib/messages/messages';
import {Options} from './lib/options';

interface Configurations {
    port: number,
    brokerPort: number,
    workers: number,
    workerPath: string,
    restartWorkerOnFail: boolean,
    pingPongInterval: number
}
// Main function
export class ClusterWS {
    // constructor an object
    constructor(public configuration: Configurations) {
        // Make sure that configuration exist as object
        this.configuration = this.configuration || {};
        // Create server
        const servers = fork(__dirname + '/lib/servers');
        // Pass options to the server
        servers.send(new ProcessMessages('init', new Options(
            this.configuration.port,
            this.configuration.workers,
            this.configuration.workerPath,
            this.configuration.restartWorkerOnFail,
            this.configuration.brokerPort,
            this.configuration.pingPongInterval)));
    }
}
