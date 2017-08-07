let _ = require('./fp')
let debug = process.env.DEBUG

export function log(x: any) {
    if (debug) console.log('DEBUG: ', x)
}

export function logError(x: any) {
    console.log('\x1b[31m' + 'Error: ' + x + '\x1b[0m', )
}