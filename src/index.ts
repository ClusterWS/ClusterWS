
import {getPath} from './lib/utils/getPath';
import {Servers} from './lib/servers';
import {Options, Configurations} from './lib/options';

/**
 * Main file which get configurations from the user,
 * check them and pass it
 * to the servers function.
 *
 * If configurations is not provided then make
 * it empty object.
 *
 * Gets path to the user server.js file
 *
 * If instance already exist so do nothing
 */
export class ClusterWS {
    private static _instance: ClusterWS;

    servers: any;
    options: Options;

    constructor(configurations: Configurations) {
        if (ClusterWS._instance) return;
        ClusterWS._instance = this;

        configurations.pathToWorker = getPath()[1].getFileName();
        configurations = configurations || {};

        this.options = new Options(configurations);
        this.servers = Servers(this.options);
    }
}

