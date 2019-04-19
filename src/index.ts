import * as cluster from 'cluster';

import { Logger } from './utils/logger';
import { isFunction } from './utils/helpers';
import { runProcesses } from './processes';
import { Options, Configurations, Mode, LogLevel, Scaler } from './utils/types';

/**
 * TODO: Pre release plans
 *
 * - Handle type for "this" keyword in worker function
 * - Run benchmarks
 * - Add all middleware
 *
 *
 * TODO: Future Plans
 *
 * - Improve positions of debug logs
 * - Split logic more nicely to make it easier to understand code
 * - Add more test
 * - Add more options validation and test that all options passed correctly
 * - Implement retry logic in connectors
 * - Better async await support
 * - Add ack event on subscribe and unsubscribe
 *
 */

// Reexport important things
export { Mode, Middleware, LogLevel, Scaler } from './utils/types';

export class ClusterWS {
  private options: Options;

  constructor(configurations: Configurations) {
    this.options = {
      port: configurations.port || (configurations.tlsOptions ? 443 : 80),
      mode: configurations.mode || Mode.Scale,
      host: configurations.host,
      logger: configurations.loggerOptions && configurations.loggerOptions.logger ?
        configurations.loggerOptions.logger : new Logger(
          !configurations.loggerOptions || configurations.loggerOptions.logLevel === undefined ?
            LogLevel.INFO : configurations.loggerOptions.logLevel),
      worker: configurations.worker,
      tlsOptions: configurations.tlsOptions,
      websocketOptions: {
        wsPath: configurations.websocketOptions ?
          configurations.websocketOptions.wsPath : null,
        autoPing: configurations.websocketOptions ?
          configurations.websocketOptions.autoPing !== false : true,
        pingInterval: configurations.websocketOptions && configurations.websocketOptions.pingInterval ?
          configurations.websocketOptions.pingInterval : 20000,
        sendConfigurationMessage: configurations.websocketOptions &&
          configurations.websocketOptions.sendConfigurationMessage === false ?
          configurations.websocketOptions.sendConfigurationMessage : true
      },
      scaleOptions: {
        restartOnFail: configurations.scaleOptions ? configurations.scaleOptions.restartOnFail : false,
        scaler: configurations.scaleOptions && configurations.scaleOptions.scaler ?
          configurations.scaleOptions.scaler : Scaler.Default,
        workers: configurations.scaleOptions && configurations.scaleOptions.workers ?
          configurations.scaleOptions.workers : 1,
        redis: configurations.scaleOptions && configurations.scaleOptions.redis ? configurations.scaleOptions.redis : null,
        default: {
          brokers: configurations.scaleOptions && configurations.scaleOptions.default && configurations.scaleOptions.default.brokers ?
            configurations.scaleOptions.default.brokers : 1,
          brokersPorts: configurations.scaleOptions && configurations.scaleOptions.default && configurations.scaleOptions.default.brokersPorts ?
            configurations.scaleOptions.default.brokersPorts : [],
          horizontalScaleOptions: configurations.scaleOptions && configurations.scaleOptions.default ?
            configurations.scaleOptions.default.horizontalScaleOptions : null
        }
      }
    };

    // populate broke ports
    if (!this.options.scaleOptions.default.brokersPorts.length) {
      for (let i: number = 0; i < this.options.scaleOptions.default.brokers; i++) {
        this.options.scaleOptions.default.brokersPorts.push(i + 9400);
      }
    }

    if (cluster.isMaster) {
      // print initialize options
      this.options.logger.debug(`Initialized Options:`, this.options, `(pid: ${process.pid})`);
    }

    // Make sure that worker function is provided
    if (!isFunction(this.options.worker)) {
      return this.options.logger.error('Worker is not provided or is not a function');
    }

    // Make sure that brokersPorts are provided properly
    if (this.options.scaleOptions.default.brokers !== this.options.scaleOptions.default.brokersPorts.length) {
      return this.options.logger.error('Number of broker ports in not the same as number of brokers');
    }

    // run actual processes
    runProcesses(this.options);
  }
}