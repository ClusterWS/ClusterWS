import * as cluster from 'cluster';

import {Options} from './options';
import {MessageFactory} from './modules/messages/messages';

/**
 * Creates MasterProcess and fork node js clusters
 * amount of clusters provided by options,
 * send all options to each worker.
 *
 * Also fork one Broker as a worker to communicate
 * between all other workers.
 *
 *
 * cluster.schedulingPolicy = cluster.SCHED_RR;
 *
 * This ^ code is used to divide connected users in different
 * workers, but it does not work well with TypeScript error check
 * so it is commented and used only for tests.
 */
export function processMaster(options: Options) {

    let broker: any;
    let workers: Array<any>;

    /**
     * Print to console that master process is
     * running.
     */
    console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + options.port + ', PID ' + process.pid);

    /**
     * Fork worker, save it in array of
     * workers
     *
     * worker.on('exit') if option
     * restartWorkerOnFail is true then
     * restart worker.
     *
     */
    const launchWorker = (i: number) => {
        let worker: any = workers[i] = cluster.fork();

        worker.on('exit', () => {
            if (options.restartWorkerOnFail) {
                console.log('\x1b[33m%s\x1b[0m', 'Restarting worker ' + i + ' on fail ');
                launchWorker(i);
            }
        });
        worker.send(MessageFactory.processMessages('initWorker', i));
    };

    /**
     * Fork broker and send init message to the broker process
     */
    broker = cluster.fork();
    broker.send(MessageFactory.processMessages('initBroker'));

    /**
     * Preallocate worker array and create worker message
     */
    workers = new Array(options.workers);

    /**
     * Launch all workers
     */
    for (let i: number = 0; i < options.workers; i++) {
        launchWorker(i);
    }
}