/**
 * Allow find from which file code was executed
 */
declare let Error: any;

export function getPath() {
    const _: any = Error.prepareStackTrace;
    Error.prepareStackTrace = (_: any, stack: any) => stack;
    const stack = new Error().stack.slice(1);
    Error.prepareStackTrace = _;
    return stack;
}