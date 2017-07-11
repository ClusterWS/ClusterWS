
import {Options, Configurations} from './lib/options';
import {Servers} from './lib/servers';

/**
 * Main file which get configurations from the user,
 * check them and pass it
 * to the servers function.
 *
 * If configurations is not provided then make
 * it empty object.
 *
 */

export class ClusterWS {
    servers: any;
    options: Options;

    constructor(public configurations: Configurations) {
        this.configurations = this.configurations || {};
        this.options = new Options(configurations);
        this.servers = Servers(this.options);
    }
}
