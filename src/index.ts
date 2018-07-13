import * as cluster from 'cluster';

import { UWebSocket } from './modules/uws/client';
import { UWebSocketsServer } from './modules/uws/server';
import { logError, isFunction, logWarning, logReady } from './utils/functions';
import { Configurations, Options } from './utils/types';
import { masterProcess, workerProcess } from './processes';

export default class ClusterWS {
  public static uWebSocket: any = UWebSocket;
  public static uWebSocketServer: any = UWebSocketsServer;

  constructor(configurations: Configurations) {
    const options: Options = {
      port: configurations.port || (configurations.tlsOptions ? 443 : 80),
      host: configurations.host || null,
      worker: configurations.worker,
      workers: configurations.workers || 1,
      brokers: configurations.brokers || 1,
      useBinary: configurations.useBinary || false,
      tlsOptions: configurations.tlsOptions || false,
      pingInterval: configurations.pingInterval || 20000,
      brokersPorts: configurations.brokersPorts || [],
      encodeDecodeEngine: configurations.encodeDecodeEngine || false,
      restartWorkerOnFail: configurations.restartWorkerOnFail || false,
      horizontalScaleOptions: configurations.horizontalScaleOptions || false
    };

    if (!options.brokersPorts.length)
      for (let i: number = 0; i < options.brokers; i++) options.brokersPorts.push(i + 9400);

    if (options.brokers !== options.brokersPorts.length || !isFunction(options.worker))
      return logError(
        !isFunction(options.worker)
          ? 'Worker param must be provided and it must be a function \n'
          : 'Number of broker ports should be the same as number of brokers\n'
      );

    cluster.isMaster ? masterProcess(options) : workerProcess(options);
  }
}
