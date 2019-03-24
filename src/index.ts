import { isFunction } from './utils/helpers';
import { runProcesses } from './processes';
import { Logger, Level } from './utils/logger';
import { Options, Configurations, Mode } from './utils/types';

// TODO: correctly handle this type in worker function
// Reexport important things
export { Mode, Middleware } from './utils/types';

export class ClusterWS {
  private options: Options;

  constructor(configurations: Configurations) {
    this.options = {
      port: configurations.port || (configurations.tlsOptions ? 443 : 80),
      mode: configurations.mode || Mode.Scale,
      host: configurations.host,
      logger: configurations.logger || new Logger(Level.INFO),
      worker: configurations.worker,
      wsPath: configurations.wsPath || null,
      workers: configurations.workers || 1,
      brokers: configurations.brokers || 1,
      autoPing: configurations.autoPing !== false,
      // useBinary: configurations.useBinary,
      tlsOptions: configurations.tlsOptions,
      pingInterval: configurations.pingInterval || 20000,
      brokersPorts: configurations.brokersPorts || [],
      // encodeDecodeEngine: configurations.encodeDecodeEngine,
      restartWorkerOnFail: configurations.restartWorkerOnFail,
      horizontalScaleOptions: configurations.horizontalScaleOptions
    };

    // populate broke ports
    if (!this.options.brokersPorts.length) {
      for (let i: number = 0; i < this.options.brokers; i++) {
        this.options.brokersPorts.push(i + 9400);
      }
    }

    // Make sure that worker function is provided
    if (!isFunction(this.options.worker)) {
      return this.options.logger.error('Worker is not provided or is not a function');
    }

    // Make sure that brokersPorts are provided properly
    if (this.options.brokers !== this.options.brokersPorts.length) {
      return this.options.logger.error('Number of broker ports in not the same as number of brokers');
    }

    // run actual processes
    runProcesses(this.options);
  }
}