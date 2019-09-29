// This is very basic logger without any transport
// if you need more functionality
// you can use any other correct logger implementation
// such as winston, pino, etc.
import { LogLevel } from './types';

export class Logger {
  constructor(private level: LogLevel) { }

  // blue color output to console with Debug prefix
  public debug(...args: any[]): void {
    if (this.level > LogLevel.DEBUG) {
      return;
    }
    // transforms object to strings before processing
    console.log(`\x1b[36mdebug:\x1b[0m`, ...args.map((item: any) => typeof item === 'object' ? JSON.stringify(item) : item));
  }

  // Green color output to console
  public info(...args: any[]): void {
    if (this.level > LogLevel.INFO) {
      return;
    }
    console.log(`\x1b[32minfo:\x1b[0m`, ...args);
  }

  // Red color output to console with Error prefix
  public error(...args: any[]): void {
    if (this.level > LogLevel.ERROR) {
      return;
    }
    console.log(`\x1b[31merror:\x1b[0m`, ...args);
  }

  // Yellow color output
  public warning(...args: any[]): void {
    if (this.level > LogLevel.WARN) {
      return;
    }
    console.log(`\x1b[33mwarning:\x1b[0m`, ...args);
  }
}