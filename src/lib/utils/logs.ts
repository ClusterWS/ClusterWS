export function logRunning(x: any) {
    console.log('\x1b[36m%s\x1b[0m', x)
}

export function logError(x: any) {
    console.log('\x1b[31m%s\x1b[0m', x)
}

export function logDebug(x: any) {
    if (process.env.DEBUG) console.log('DEBUG: ', x)
}