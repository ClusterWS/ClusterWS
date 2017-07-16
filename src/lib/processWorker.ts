import {Options} from './options';
import {Worker} from './modules/worker';
import {Broker} from './modules/pubsub-server/broker';
import {ProcessMessages} from './modules/messages/messages';

export function processWorker(options: Options) {
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
            server = new Broker(options);
            server.is = 'Broker';
        }
        if (message.type === 'initWorker') {
            options.id = message.data;
            server = new Worker(options);
            server.is = 'Worker';
            options.worker.call(server);
        }
    });

    /**
     * process.on('uncaughtException') listens on all errors in workers or broker
     * and print it to console.
     *
     * on each error worker process will be exited.
     */
    process.on('uncaughtException', (err: any) => {
        console.log('\x1b[31m%s\x1b[0m', server.is + ', PID ' + process.pid + '\n' + err + '\n');
        process.exit();
    });
}

