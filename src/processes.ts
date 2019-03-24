import * as cluster from 'cluster';

import { Worker } from './modules/worker';
import { generateUid } from './utils/helpers';
import { Options, Mode, Message, Listener } from './utils/types';

// check mode/process type and decide what to execute next
export function runProcesses(options: Options): any {
  // validate in which mode are we running
  if (options.mode === Mode.SingleProcess) {
    options.logger.info(` Running in single process on port: ${options.port}, PID ${process.pid} ${options.tlsOptions ? '(secure)' : ''}`);
    return new Worker(options, '');
  }

  cluster.isMaster ? masterProcess(options) : childProcess(options);
}

// create master process and from master generate the rest of the processes
function masterProcess(options: Options): void {
  let scalerReady: string;
  const serverId: string = generateUid(10);
  const securityKey: string = generateUid(20);
  const readyBrokers: any = [];
  const readyWorkers: any = [];

  const forkNewProcess: Listener = (id: number, name: string, isRestart?: boolean): void => {
    const forkedProcess: cluster.Worker = cluster.fork();

    forkedProcess.on('message', (message: Message) => {
      options.logger.debug('Message from child', message);

      // if event is not ready then we dont need to process this
      if (message.event !== 'READY') { return; }

      if (isRestart) {
        return options.logger.info(`${name} ${id} PID ${message.pid} has been restarted`);
      }

      if (name === 'Scaler') {
        scalerReady = ` Scaler on: ${options.horizontalScaleOptions.masterOptions.port}, PID ${message.pid}`;
        for (let i: number = 0; i < options.brokers; i++) {
          forkNewProcess(i, 'Broker');
        }
      }

      if (name === 'Broker') {
        readyBrokers[id] = ` Broker on: ${options.brokersPorts[id]}, PID ${message.pid}`;
        if (readyBrokers.length === options.brokers && !readyBrokers.includes(undefined)) {
          // we can start forking worker
          for (let i: number = 0; i < options.workers; i++) {
            forkNewProcess(i, 'Worker');
          }
        }
      }

      if (name === 'Worker') {
        readyWorkers[id] = `    Worker: ${id}, PID ${message.pid}`;
        if (readyWorkers.length === options.workers && !readyWorkers.includes(undefined)) {
          options.logger.info(` Master on: ${options.port}, PID ${process.pid} ${options.tlsOptions ? '(secure)' : ''}`);

          if (scalerReady) {
            options.logger.info(scalerReady);
          }
          readyBrokers.forEach(options.logger.info);
          readyWorkers.forEach(options.logger.info);
        }
      }
    });

    forkedProcess.on('exit', () => {
      options.logger.error(`${name} ${id} has exited`);
      if (options.restartWorkerOnFail) {
        options.logger.warning(`${name} ${id} is restarting \n`);
        forkNewProcess(id, name, true);
      }
    });

    // inform created chile about who he is
    forkedProcess.send({ id, name, serverId, securityKey });
  };

  for (let i: number = 0; i < options.brokers; i++) {
    forkNewProcess(i, 'Broker');
  }
}

function childProcess(options: Options): void {
  process.on('message', (message: Message) => {
    options.logger.debug('Message from master', message);

    // create specified child instance
    switch (message.name) {
      case 'Worker':
        return new Worker(options, message.securityKey);
      default:
        process.send({ event: 'READY', pid: process.pid });
    }
  });

  process.on('uncaughtException', (error: Error) => {
    options.logger.error(`${error.stack || error}`);
    process.exit();
  });
}