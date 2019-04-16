import * as cluster from 'cluster';

import { Worker } from './modules/worker';
import { generateUid } from './utils/helpers';
import { BrokerServer } from './modules/broker/server';
import { ScalerServer } from './modules/broker/scaler';
import { Options, Mode, Message, Listener, Scaler } from './utils/types';

// check mode/process type and decide what to execute next
export function runProcesses(options: Options): any {
  // validate in which mode are we running
  if (options.mode === Mode.Single) {
    options.logger.info(` Running on: ${options.port}, PID ${process.pid} ${options.tlsOptions ? '(secure)' : ''}`);
    // we dont need key for single process as it is not going to connect to any broker
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
      options.logger.debug(`Message from ${name}:`, message, `(pid: ${process.pid})`);

      // if event is not ready then we dont need to process this
      if (message.event !== 'READY') { return; }

      if (isRestart) {
        return options.logger.info(`${name} ${id} PID ${message.pid} has been restarted`);
      }

      if (name === 'Scaler') {
        scalerReady = ` Scaler on: ${options.scaleOptions.default.horizontalScaleOptions.masterOptions.port}, PID ${message.pid}`;
        for (let i: number = 0; i < options.scaleOptions.default.brokers; i++) {
          forkNewProcess(i, 'Broker');
        }
      }

      if (name === 'Broker') {
        readyBrokers[id] = ` Broker on: ${options.scaleOptions.default.brokersPorts[id]}, PID ${message.pid}`;
        if (readyBrokers.length === options.scaleOptions.default.brokers && !readyBrokers.includes(undefined)) {
          // we can start forking worker
          for (let i: number = 0; i < options.scaleOptions.workers; i++) {
            forkNewProcess(i, 'Worker');
          }
        }
      }

      if (name === 'Worker') {
        readyWorkers[id] = `    Worker: ${id}, PID ${message.pid}`;
        if (readyWorkers.length === options.scaleOptions.workers && !readyWorkers.includes(undefined)) {
          options.logger.info(` Master on: ${options.port}, PID ${process.pid} ${options.tlsOptions ? '(secure)' : ''}`);

          if (scalerReady) {
            options.logger.info(scalerReady);
          }

          if (options.scaleOptions.scaler === Scaler.Default) {
            readyBrokers.forEach((msg: string) => options.logger.info(msg));
          }
          readyWorkers.forEach((msg: string) => options.logger.info(msg));
        }
      }
    });

    forkedProcess.on('exit', () => {
      options.logger.error(`${name} ${id} has exited`);
      // if (options.restartWorkerOnFail) {
      //   options.logger.warning(`${name} ${id} is restarting \n`);
      //   forkNewProcess(id, name, true);
      // }
    });

    // inform created chile about who he is
    forkedProcess.send({ id, name, serverId, securityKey });
  };

  if (options.scaleOptions.scaler === Scaler.Default) {
    if (options.scaleOptions.default.horizontalScaleOptions && options.scaleOptions.default.horizontalScaleOptions.masterOptions) {
      forkNewProcess(-1, 'Scaler');
    } else {
      for (let i: number = 0; i < options.scaleOptions.default.brokers; i++) {
        forkNewProcess(i, 'Broker');
      }
    }
  } else {
    for (let i: number = 0; i < options.scaleOptions.workers; i++) {
      forkNewProcess(i, 'Worker');
    }
  }
}

function childProcess(options: Options): void {
  process.on('message', (message: Message) => {
    options.logger.debug('Message from Master:', message, `(pid: ${process.pid})`);

    // create specified child instance
    switch (message.name) {
      case 'Worker':
        return new Worker(options, message.securityKey);
      case 'Broker':
        return new BrokerServer(options, options.scaleOptions.default.brokersPorts[message.id], message.securityKey, message.serverId);
      case 'Scaler':
        return new ScalerServer(options);
      default:
        process.send({ event: 'READY', pid: process.pid });
    }
  });

  process.on('uncaughtException', (error: Error) => {
    options.logger.error(`${error.stack || error}`);
    process.exit();
  });
}