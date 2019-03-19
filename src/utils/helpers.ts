export function isFunction<T>(fn: T): boolean {
  return {}.toString.call(fn) === '[object Function]';
}
