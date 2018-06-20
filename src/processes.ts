import * as cluster from 'cluster';

import { Worker } from './modules/worker';
import { GlobalBrokerServer } from './modules/broker/global';
import { InternalBrokerServer } from './modules/broker/internal';
import { Options, CustomObject, Message } from './utils/types';
import { logReady, logWarning, logError, generateKey, keysOf } from './utils/functions';

export function masterProcess(options: Options): void {
  let serverIsReady: boolean = false;

  const brokersReady: CustomObject = {};
  const workersReady: CustomObject = {};

  const securityKey: string = generateKey(10);
  const uniqueServerId: string = generateKey(10);

  if (options.horizontalScaleOptions && options.horizontalScaleOptions.masterOptions) launchNewProcess('Scaler', -1);
  else for (let i: number = 0; i < options.brokers; i++) launchNewProcess('Broker', i);

  function launchNewProcess(processName: string, processId: number): void {
    let newProcess: cluster.Worker = cluster.fork();

    newProcess.on(
      'message',
      (message: Message): void => {
        if (serverIsReady) return logReady(`${processName} PID ${message.pid} has been restarted`);

        const actions: CustomObject = {
          Scaler: (): void => {
            for (let i: number = 0; i < options.brokers; i++) launchNewProcess('Broker', i);
          },
          Worker: (): void => {
            workersReady[processId] = `\tWorker: ${processId}, PID ${message.pid}`;
          },
          Broker: (): void => {
            brokersReady[processId] = `>>>  Broker on: ${options.brokersPorts[processId]}, PID ${message.pid}`;
            if (keysOf(brokersReady).length === options.brokers)
              for (let i: number = 0; i < options.workers; i++) launchNewProcess('Worker', i);
          }
        };

        actions[processName]();

        // Print to console after all processes are ready
        if (keysOf(brokersReady).length === options.brokers && keysOf(workersReady).length === options.workers) {
          serverIsReady = true;
          logReady(`>>>  Master on: ${options.port}, PID: ${process.pid} ${options.tlsOptions ? ' (secure)' : ''}`);
          keysOf(brokersReady).forEach((key: string) => logReady(brokersReady[key]));
          keysOf(workersReady).forEach((key: string) => logReady(workersReady[key]));
        }
      }
    );

    newProcess.on('exit', () => {
      newProcess = null;
      logError(`${processName} has exited \n`);
      if (options.restartWorkerOnFail) {
        logWarning(`${processName} is restarting \n`);
        launchNewProcess(processName, processId);
      }
    });

    newProcess.send({ processId, processName, securityKey, uniqueServerId });
  }
}

export function workerProcess(options: Options): void {
  process.on(
    'message',
    (message: Message): void => {
      const actions: CustomObject = {
        Worker: (): Worker => new Worker(options, message.securityKey),
        Scaler: (): void => options.horizontalScaleOptions && GlobalBrokerServer(options.horizontalScaleOptions),
        Broker: (): void => {
          options.horizontalScaleOptions && (options.horizontalScaleOptions.serverId = message.uniqueServerId);
          InternalBrokerServer(
            options.brokersPorts[message.processId],
            message.securityKey,
            options.horizontalScaleOptions
          );
        }
      };
      actions[message.processName] && actions[message.processName]();
    }
  );

  process.on(
    'uncaughtException',
    (err: Error): void => {
      logError(`PID: ${process.pid}\n ${err.stack}\n`);
      process.exit();
    }
  );
}
