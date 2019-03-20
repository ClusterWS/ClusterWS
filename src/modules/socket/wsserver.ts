import { Options } from '../../utils/types';
import { EventEmitter } from '../../utils/emitter';

export class WSServer extends EventEmitter {
  constructor(private options: Options) {
    super(options.logger);
  }
}