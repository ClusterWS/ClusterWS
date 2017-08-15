import { Options } from './lib/options'
import { isMaster } from 'cluster'
import { processMaster } from './lib/processMaster'
import { processWorker } from './lib/processWorker'

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
    private static instance: ClusterWS

    constructor(configurations: any) {
        if (ClusterWS.instance) return
        ClusterWS.instance = this

        let options = new Options(configurations || {})
        isMaster ? processMaster(options) : processWorker(options)
    }
}