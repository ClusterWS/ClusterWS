import * as cluster from 'cluster';

import { Worker } from './modules/worker';
import { Scaler } from './modules/broker/scaler';
import { Broker } from './modules/broker/server';
import { Options, Message } from './utils/types';
import { logError, generateKey, logWarning, logReady } from './utils/functions';

export function masterProcess(options: Options): void {
  let isReady: boolean = false;

  // string[] does not compile because includes does not exist
  let scalerReady: string;
  const brokersReady: any = [];
  const workersReady: any = [];

  const serverId: string = generateKey(20);
  const internalSecurityKey: string = generateKey(20);

  // check if we run Scaler process, if not then boot brokers
  // we can have only one scaler per server scaler id is always -1
  if (options.horizontalScaleOptions && options.horizontalScaleOptions.masterOptions) {
    createNewProcess('Scaler', -1);
  } else {
    for (let i: number = 0; i < options.brokers; i++) {
      createNewProcess('Broker', i);
    }
  }

  function createNewProcess(processName: string, processId: number): void {
    const newProcess: cluster.Worker = cluster.fork();

    newProcess.on('message', (message: Message): void => {
      if (message.event !== 'READY') { return; }

      if (isReady) {
        return logReady(`${processName} ${processId} PID ${message.pid} has been restarted`);
      }

      switch (processName) {
        case 'Broker':
          brokersReady[processId] = ` Broker on: ${options.brokersPorts[processId]}, PID ${message.pid}`;
          if (!brokersReady.includes(undefined) && brokersReady.length === options.brokers) {
            for (let i: number = 0; i < options.workers; i++) {
              createNewProcess('Worker', i);
            }
          }
          break;
        case 'Worker':
          workersReady[processId] = `    Worker: ${processId}, PID ${message.pid}`;
          if (!workersReady.includes(undefined) && workersReady.length === options.workers) {
            isReady = true;
            logReady(` Master on: ${options.port}, PID ${process.pid} ${options.tlsOptions ? '(secure)' : ''}`);
            if (scalerReady) {
              logReady(scalerReady);
            }
            brokersReady.forEach(logReady);
            workersReady.forEach(logReady);
          }
          break;
        case 'Scaler':
          scalerReady = ` Scaler on: ${options.horizontalScaleOptions.masterOptions.port}, PID ${message.pid}`;
          for (let i: number = 0; i < options.brokers; i++) {
            createNewProcess('Broker', i);
          }
          break;
      }
    });

    newProcess.on('exit', (): void => {
      logError(`${processName} ${processId} has exited`);
      if (options.restartWorkerOnFail) {
        logWarning(`${processName} ${processId} is restarting \n`);
        createNewProcess(processName, processId);
      }
    });

    newProcess.send({ processId, processName, serverId, internalSecurityKey });
  }
}

export function workerProcess(options: Options): void {
  process.on('message', (message: Message): Worker | Broker | Scaler => {
    switch (message.processName) {
      case 'Scaler':
        return new Scaler(options.horizontalScaleOptions);
      case 'Worker':
        return new Worker(options, message.internalSecurityKey);
      case 'Broker':
        return new Broker(options, options.brokersPorts[message.processId], message.internalSecurityKey, message.serverId);
    }
  });

  // worker process add logic to create instances
  process.on('uncaughtException', (error: Error) => {
    logError(`${error.stack || error}`);
    process.exit();
  });
}