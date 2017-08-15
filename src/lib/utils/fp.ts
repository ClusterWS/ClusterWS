/* Curry Module */
let curry = (fn: any) =>
    function curring(...args: any[]) {
        return args.length < fn.length ?
            (...newArgs: any[]) => curring.call(null, ...args, ...newArgs) :
            fn.length ? fn.call(null, ...args) : fn
    }


/* Switch Module */
let isFunction = (f: any) => f ? typeof f === 'function' ? f() : f : ''
let switchcase = curry((cases: any, key: any) => key in cases ? isFunction(cases[key]) : isFunction(cases['default']))


/* Map Module */
let mapArray = (iteratee: any, array: any) => {
    let index: number = -1
    const length: number = array == null ? 0 : array.length
    const result: any = new Array(length)
    while (++index < length) result[index] = iteratee(array[index], index, array)
    return result
}
let mapObject = (iteratee: any, object: any) => {
    const result: any = {}
    object = Object(object)
    Object.keys(object).forEach((key) => result[key] = iteratee(object[key], key, object))
    return result
}
let map = curry((fn: any, x: any) => x instanceof Array ? mapArray(fn, x) : mapObject(fn, x))


/* Export all modules */
export let _ = {
    map: map,
    curry: curry,
    switchcase: switchcase
}


