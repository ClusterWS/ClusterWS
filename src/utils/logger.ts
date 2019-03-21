// TODO: complete writing logger
export enum Level {
  ALL = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4
}

export class Logger {
  constructor(private level: Level) { }

  // blue color output to console with Debug prefix
  public debug(prefix: string, data: any): void {
    if (this.level > Level.DEBUG) {
      return;
    }

    let printData: any = data;
    if (typeof data === 'object') {
      printData = JSON.stringify(data);
    }
    process.stdout.write(`\x1b[36mDebug:\x1b[0m ${prefix} - ${printData}\n`);
  }

  // Green color output to console
  public info(data: any): void {
    if (this.level > Level.INFO) {
      return;
    }
    process.stdout.write(`\x1b[32m\u2713 ${data}\x1b[0m\n`);
  }

  // Red color output to console with Error prefix
  public error(data: any): void {
    if (this.level > Level.ERROR) {
      return;
    }
    process.stdout.write(`\x1b[31mError:\x1b[0m ${data}\n`);
  }

  public warning(): void {
    if (this.level > Level.WARN) {
      return;
    }
    // write warning
  }
}