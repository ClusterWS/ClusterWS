import {fork} from 'child_process';
import {MessageFactory} from './lib/modules/messages/messages';
import {Options, Configurations} from './lib/options';

/**
 * Main file which get configurations from the user,
 * fork new chile process and pass options
 * to the servers (child process) file.
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

        this.servers = fork(__dirname + '/lib/servers');

        this.servers.send(MessageFactory.processMessages('init', this.options));
    }
}
