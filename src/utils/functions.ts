import { randomBytes } from 'crypto';
import { CustomObject } from './types';

export function keysOf(object: CustomObject): string[] {
  return Object.keys(object);
}

export function logError<T>(data: T): any {
  return process.stdout.write(`\x1b[31mError PID ${process.pid}:\x1b[0m  ${data}\n`);
}

export function logReady<T>(data: T): any {
  return process.stdout.write(`\x1b[32m\u2713 ${data}\x1b[0m\n`);
}

export function logWarning<T>(data: T): any {
  return process.stdout.write(`\x1b[33mWarning PID ${process.pid}:\x1b[0m ${data}\n`);
}

export function isFunction<T>(fn: T): boolean {
  return {}.toString.call(fn) === '[object Function]';
}

export function generateKey(length: number): string {
  return (
    randomBytes(Math.ceil(length / 4))
      .toString('hex')
      .slice(0, length / 2) +
    Date.now() +
    randomBytes(Math.ceil(length / 4))
      .toString('hex')
      .slice(0, length / 2)
  );
}
