import { fork } from 'cluster';
import { Options } from './options';
import { MessageFactory, ProcessMessages } from './modules/messages/messages';
import * as cluster from 'cluster';

/**
 * Create master process and spawn workers and broker.
 * 
 * cluster.schedulingPolicy = cluster.SCHED_RR;
 */
export function processMaster(options: Options) {

    let broker: any;
    let workers: any[];

    /**
     * Print to console that master process is
     * running.
     */
    console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + options.port + ', PID ' + process.pid);

    /**
     * Fork worker, save it in array of
     * worker.
     */
    const launchWorker = (i: number) => {
        let worker: any = workers[i] = fork();

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
    broker = fork();
    broker.send(MessageFactory.processMessages('initBroker'));

    /**
     * Preallocate worker array
     */
    workers = new Array(options.workers);

    /**
     * Launch all workers
     */
    for (let i: number = 0; i < options.workers; i++) {
        launchWorker(i);
    }
}