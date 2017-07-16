import * as cluster from 'cluster';

import {Worker} from './modules/worker';
import {Broker} from './modules/pubsub-server/broker';
import {Options} from './options';
import {ProcessMessages, MessageFactory} from './modules/messages/messages';

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
declare let process: any;

export function Servers(options: Options) {
    if (cluster.isMaster) {
        let broker: any;
        let workers: Array<any>;
        let initWorkerMsg: ProcessMessages;

        /**
         * Print to console that master process is
         * running.
         */
        console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + options.port + ', PID ' + process.pid);

        /**
         * Fork worker, save it in array of
         * workers modify, message and send it
         * to the worker.
         *
         * worker.on('exit') is listening on exit
         * from the worker and if option
         * restartWorkerOnFail is true then
         * restart worker.
         *
         */
        const launchWorker = (i: number) => {
            let worker: any = workers[i] = cluster.fork();
            initWorkerMsg.data.id = i;

            worker.on('exit', () => {
                if (options.restartWorkerOnFail) {
                    console.log('\x1b[33m%s\x1b[0m', 'Restarting worker on fail ' + initWorkerMsg.data.id);
                    launchWorker(i);
                }
            });
            worker.send(initWorkerMsg);
        };

        /**
         * Fork broker and send init message to the broker process
         */
        broker = cluster.fork();
        broker.send(MessageFactory.processMessages('initBroker', options));

        /**
         * Preallocate worker array and create worker message
         */
        workers = new Array(options.workers);
        initWorkerMsg = MessageFactory.processMessages('initWorker', options);

        /**
         * Launch all workers
         */
        for (let i: number = 0; i < options.workers; i++) {
            launchWorker(i);
        }

        return;
    }

    let server: any;

    /**
     * process.in('message') is listening on all messages from master process.
     * it checks the type of message if message is initWorker then create new
     * worker . if message type is initBroker then create broker.
     *
     * Also each worker connect worker file which provided by user
     *
     */
    process.on('message', (message: ProcessMessages) => {
        if (message.type === 'initBroker') {
            server = new Broker(message.data);
            server.is = 'Broker';
        }
        if (message.type === 'initWorker') {
            server = new Worker(message.data);
            server.is = 'Worker';
            eval('require')(message.data.pathToWorker).Worker(server);
        }
    });

    /**
     * process.on('uncaughtException') listens on all errors in workers or broker
     * and print it to console.
     *
     * on each error worker process will be exited.
     *
     */
    process.on('uncaughtException', (err: any) => {
        console.log('\x1b[31m%s\x1b[0m', server.is + ', PID ' + process.pid + '\n' + err + '\n');
        process.exit();
    });
}
