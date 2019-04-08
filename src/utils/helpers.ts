import { randomBytes } from 'crypto';

export function selectRandomBetween(from: number, to: number): number {
  return Math.floor(Math.random() * to) + from;
}

export function isFunction<T>(fn: T): boolean {
  const functionType: string = {}.toString.call(fn);
  return functionType === '[object Function]' || functionType === '[object AsyncFunction]';
}

export function generateUid(length: number): string {
  return randomBytes(length).toString('hex');
}