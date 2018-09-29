import { randomBytes } from 'crypto';

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  return randomBytes(length).toString('hex');
}