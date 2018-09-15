import * as cluster from 'cluster';

import { logError } from './utils/functions';
import { Options, Configurations } from './utils/types';

export default class ClusterWS {
  private options: Options;

  constructor(configurations: Configurations) {
    this.options = {
      port: configurations.port || (configurations.tlsOptions ? 443 : 80),
      host: configurations.host,
      worker: configurations.worker,
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

    if (!this.options.worker) {
      // need to add proper error handler
      logError('Here is error');
    }
    // if (!configurations.worker) {
    //     throw "hello world";
    // }
    // console.log(cluster);
  }
}