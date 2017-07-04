import * as cluster from 'cluster';
import {ProcessMessages} from './messages/messages';
import {Worker} from './modules/worker';
import {Broker} from './modules/pubsub-server/broker';

// Check if process is Master
if (cluster.isMaster) {
// cluster.schedulingPolicy = cluster.SCHED_RR;

    // Create variables
    let workers: Array<any>;
    let msgToWorker: ProcessMessages;

    const launchWorker = (i: number) => {
        // Launch worker
        let worker: any = workers[i] = cluster.fork();
        // Give an ID to the worker
        msgToWorker.data.id = i;

        // Listen for exit action from the worker
        worker.on('exit', () => {
            // In case if option restartWorkerOnFail was set to true then restart worker
            if (msgToWorker.data.restartWorkerOnFail) {
                console.log('\x1b[33m%s\x1b[0m', 'Restarting worker on fail ' + msgToWorker.data.id);
                launchWorker(i);
            }
        });

        // Send message to the worker with all configurations
        worker.send(msgToWorker);
    };

    // Listen on message from master process
    process.on('message', (message: ProcessMessages) => {
        // If message is init then create broker and workers
        if (message.type === 'init') {
            console.log('\x1b[36m%s\x1b[0m', '>>> Master on: ' + message.data.port + ', PID ' + process.pid);
            // Allocate array for workers
            workers = new Array(message.data.workers);
            // Prepare message for worker
            msgToWorker = new ProcessMessages('initWorker', message.data);
            // Fork Broker
            cluster.fork().send(new ProcessMessages('initBroker', message.data));
            // Fork all workers
            // TODO: Use async function to create worker!
            for (let i: number = 0; i < message.data.workers; i++) {
                launchWorker(i);
            }
        }
    });

} else {
    // Create worker variable
    let server: any;

    // Listen for message from the master
    process.on('message', (message: ProcessMessages) => {
        // If message is to init worker then create worker
        if (message.type === 'initWorker') {
            // Create new Worker
            server = new Worker(message.data);
            server.is = 'Worker';
            // Connect user worker with library worker
            require(message.data.workerPath)(server);
        }
        if (message.type === 'initBroker') {
            // Create broker server
            server = new Broker(message.data);
            server.is = 'Broker';
        }
    });

    // If some error happened in the worker or broker then console log the error and close worker process
    // TODO: Make sever id for broker
    process.on('uncaughtException', (err: any) => {
        if (!server.id) server.id = 'BR';
        console.error('\x1b[31m%s\x1b[0m', server.is + ' ' + server.id + ', PID ' + process.pid + '\n' + err + '\n');
        process.exit();
    });
}