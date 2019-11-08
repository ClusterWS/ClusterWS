import { randomBytes } from 'crypto';

export function noop(): void { /** ignore */ }

export function uuid(length: number): string {
  return randomBytes(length / 2).toString('hex');
}

export function indexOf(value: string, arr: string[]): number {
  for (let i: number = 0, len: number = arr.length; i < len; i++) {
    if (arr[i] === value) {
      return i;
    }
  }

  return -1;
}

export function objectIsEmpty(object: { [key: string]: any }): boolean {
  for (const key in object) {
    if (object.hasOwnProperty(key)) {
      return false;
    }
  }

  return true;
}

export function unixPath(path: string): string {
  // TODO: verify on windows
  if (process.platform === 'win32') {
    path = path.replace(/^\//, '');
    path = path.replace(/\//g, '-');
    path = `\\\\.\\pipe\\${path}`;
  }

  return path;
}