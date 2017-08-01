let _ = require('./fp')
let debug = process.env.DEBUG

export function log(x: any) {
    if (debug) console.log('DEBUG: ', x)
    return
}