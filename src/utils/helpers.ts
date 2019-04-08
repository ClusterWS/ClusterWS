import { randomBytes } from 'crypto';

export function selectRandomBetween(from: number, to: number): number {
  return Math.floor(Math.random() * to) + from;
}

export function isFunction<T>(fn: T): boolean {
  return typeof fn === 'function';
}

export function generateUid(length: number): string {
  return randomBytes(length).toString('hex');
}