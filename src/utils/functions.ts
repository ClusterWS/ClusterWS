export function logError<T>(data: T): any {
  return process.stdout.write(`\x1b[31mError PID ${process.pid}:\x1b[0m  ${data}\n`);
}

export function isFunction<T>(fn: T): boolean {
  return {}.toString.call(fn) === '[object Function]';
}