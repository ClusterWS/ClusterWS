/* Curry module */
let curry = (fn: any) =>
    function curring(...args: any[]) {
        return args.length < fn.length ?
            (...newArgs: any[]) => curring.call(null, ...args, ...newArgs) :
            fn.length ? fn.call(null, ...args) : fn
    }


/*  Switch module */
let isFunction = (f: any) => typeof f === 'function' ? f() : f
let switchcase = curry((cases: any, key: any) => key in cases ? isFunction(cases[key]) : isFunction(cases['default']))

export let _ = {
    curry: curry,
    switchcase: switchcase
}


