import * as cluster from 'cluster';
import {ProcessMessages, MessageFactory} from './modules/messages/messages';
import {Worker} from './modules/worker';
import {Broker} from './modules/pubsub-server/broker';

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
 *
 */
declare let process:any;

if (cluster.isMaster) {

    let broker: any;
    let workers: Array<any>;
    let initWorkerMsg: ProcessMessages;

    /**
     * Listen on messages from Broker and Workers
     *
     * if type is error, display message to the console with red color
     *
     */

    const handleWorkersMessages = (server: any) => {
        server.on('message', (message: ProcessMessages) => {
            if(message.type === 'error'){
                console.error('\x1b[31m%s\x1b[0m', message.data.is + ' ' + ', PID ' + message.data.pid + '\n' + message.data.err + '\n');
            }
        });
    };

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
            if (initWorkerMsg.data.restartWorkerOnFail) {
                console.log('\x1b[33m%s\x1b[0m', 'Restarting worker on fail ' + initWorkerMsg.data.id);
                launchWorker(i);
            }
        });
        handleWorkersMessages(worker);
        worker.send(initWorkerMsg);
    };

    /**
     * process.on('message') is listening on message from the master
     * process. If message.type is init then fork broker and
     * preallocate space in array for workers.
     *
     * Also print to console that master process is
     * running. And run loop to fork workers.
     *
     */
    process.on('message', (message: ProcessMessages) => {
        if (message.type === 'init') {
            console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + message.data.port + ', PID ' + process.pid);

            workers = new Array(message.data.workers);
            initWorkerMsg = MessageFactory.processMessages('initWorker', message.data);

            broker = cluster.fork();
            handleWorkersMessages(broker);
            broker.send(MessageFactory.processMessages('initBroker', message.data));

            for (let i: number = 0; i < message.data.workers; i++) {
                launchWorker(i);
            }
        }
    });


} else {

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
        if (message.type === 'initWorker') {
            server = new Worker(message.data);
            server.is = 'Worker';
            require(message.data.pathToWorker)(server);
        }
        if (message.type === 'initBroker') {
            server = new Broker(message.data);
            server.is = 'Broker';
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
        process.send(MessageFactory.processMessages('error',MessageFactory.processErrors(err.toString(), server.is, process.pid)));
        process.exit();
    });
}