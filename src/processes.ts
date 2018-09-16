import * as cluster from 'cluster';

import { Options, Message } from './utils/types';
import { logError, generateKey } from './utils/functions';

export function masterProcess(options: Options): void {
  const serverId: string = generateKey(20);
  const internalSecurityKey: string = generateKey(20);

  // check if we run Scaler process, if not then boot brokers
  // we can have only one scaler per server scaler id always -1
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
      // implement logic to register redy processes
    });

    newProcess.on('exit', (): void => {
      logError(`${processName} has exited`);
      if (options.restartWorkerOnFail) {
        // need to add reboot warning
        createNewProcess(processName, processId);
      }
    });

    newProcess.send({ processId, processName, serverId, internalSecurityKey });
  }
}

export function workerProcess(options: Options): void {
  // worker process
}