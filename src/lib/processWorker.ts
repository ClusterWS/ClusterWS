import { Worker } from './modules/worker';
import { Broker } from './modules/pubsub-server/broker';
import { Options } from './options';
import { ProcessMessages } from './modules/messages/messages';

export function processWorker(options: Options) {
    let server: any;

    /**
     * Listen for messages from the master process and create 
     * worker or broker
     */
    process.on('message', (message: ProcessMessages) => {
        switch (message.type) {
            case 'initBroker':
                server = new Broker(options);
                server.is = 'Broker';
                break;
            case 'initWorker':
                options.id = message.data;
                server = new Worker(options);
                server.is = 'Worker';
                options.worker.call(server);
                break;
            default: break;
        }
    });

    /**
     * Print error to the console in red collor
     */
    process.on('uncaughtException', (err: any) => {
        console.log('\x1b[31m%s\x1b[0m', server.is + ', PID ' + process.pid + '\n' + err.stack + '\n');
        process.exit();
    });
}

