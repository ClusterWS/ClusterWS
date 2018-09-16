import * as cluster from 'cluster';

import { Options } from './utils/types';
import { logError } from './utils/functions';

export function masterProcess(options: Options): void {
  // Master process

  function createNewProcess(processName: string, processId: number): void {
    const newProcess: cluster.Worker = cluster.fork();

    newProcess.on('message', () => {
      //
    });

    newProcess.on('exit', (): void => {
      logError(`${processName} has exited`);
      if (options.restartWorkerOnFail) {
        // need to add reboot warning
        createNewProcess(processName, processId);
      }
    });
    //
  }
}

export function workerProcess(options: Options): void {
  // worker process
}