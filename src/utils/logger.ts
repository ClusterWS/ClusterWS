// TODO: complete writing logger
export class Logger {
  constructor(private level: string) {

  }

  public debug(prefix: string, data: any): void {
    // write debug
    let printData: any = data;
    if (typeof data === 'object') {
      printData = JSON.stringify(data);
    }
    process.stdout.write(`\x1b[36mDebug:\x1b[0m ${prefix} - ${printData}\n`);
  }

  // Green color output to console
  public info(data: any): void {
    process.stdout.write(`\x1b[32m\u2713 ${data}\x1b[0m\n`);
  }

  // Red color output to console with Error prefix
  public error(data: any): void {
    process.stdout.write(`\x1b[31mError:\x1b[0m ${data}\n`);
  }

  public warning(): void {
    // write warning
  }
}