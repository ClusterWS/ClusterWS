import { EventEmitter } from '../../utils/emitter';
import { Options, Listener } from '../../utils/types';

export class WSServer extends EventEmitter {
  public middleware: { [key: string]: Listener } = {};

  constructor(private options: Options) {
    super();
    // create connections to the brokers (still need to work on broker part)
  }

  public setMiddleware(name: string, listener: Listener): void {
    this.middleware[name] = listener;
  }
}