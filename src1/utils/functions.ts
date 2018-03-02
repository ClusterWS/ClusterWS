import * as crypto from 'crypto'

export function logError<T>(data: T): any {
  return console.log('\x1b[31m%s\x1b[0m', data)
}

export function logReady<T>(data: T, printTime: boolean = false): any {
  return console.log('\x1b[36m%s\x1b[0m', data)
}

export function logWarning<T>(data: T): any {
  return console.log('\x1b[33m%s\x1b[0m', data)
}

export function generateKey(length: number): string {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}
