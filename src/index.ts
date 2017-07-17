import { isMaster } from 'cluster';
import { processMaster } from './lib/processMaster';
import { processWorker } from './lib/processWorker';
import { Options, Configurations } from './lib/options';

/**
 * Main file which get configurations from the user,
 * check them and pass it
 * to the worker and master
 *
 * If configurations is not provided then make
 * it empty object.
 *
 * If instance already existdo nothing
 */
export class ClusterWS {
    private static _instance: ClusterWS;
    options: Options;

    constructor(public configurations: Configurations) {
        if (ClusterWS._instance) return;
        ClusterWS._instance = this;

        this.configurations = this.configurations || {};
        this.options = new Options(this.configurations);

        if (isMaster) {
            processMaster(this.options);
        } else {
            processWorker(this.options);
        }
    }
}

