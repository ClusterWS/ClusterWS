import * as cluster from 'cluster';

import { logError, isFunction } from './utils/functions';
import { Options, Configurations } from './utils/types';
import { workerProcess, masterProcess } from './processes';

export default class ClusterWS {
  private options: Options;

  constructor(configurations: Configurations) {
    this.options = {
      port: configurations.port || (configurations.tlsOptions ? 443 : 80),
      host: configurations.host,
      worker: configurations.worker,
      wssPath: configurations.wssPath || null,
      workers: configurations.workers || 1,
      brokers: configurations.brokers || 1,
      useBinary: configurations.useBinary,
      tlsOptions: configurations.tlsOptions,
      pingInterval: configurations.pingInterval || 20000,
      brokersPorts: configurations.brokersPorts || [],
      encodeDecodeEngine: configurations.encodeDecodeEngine,
      restartWorkerOnFail: configurations.restartWorkerOnFail,
      horizontalScaleOptions: configurations.horizontalScaleOptions
    };

    // If ports were not provided then generate them from 9400+
    if (!this.options.brokersPorts.length) {
      for (let i: number = 0; i < this.options.brokers; i++) {
        this.options.brokersPorts.push(i + 9400);
      }
    }

    // Make sure that worker function is provided
    if (!isFunction(this.options.worker)) {
      return logError('Worker must be provided and it must be a function');
    }

    // Make sure that brokersPorts are provided properly
    if (this.options.brokers !== this.options.brokersPorts.length) {
      return logError('Number of broker ports should be the same as number of brokers');
    }

    cluster.isMaster ? masterProcess(this.options) : workerProcess(this.options);
  }
}