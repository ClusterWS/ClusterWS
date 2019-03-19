import { Options, Mode, Message } from '../utils/types';

export class Worker {

  constructor(public options: Options, securityKey?: string) {
    console.log(`called in current process ${process.pid}`);
  }
}