export function logError(data: any): any {
    return console.log('\x1b[31m%s\x1b[0m', data)
}

export function logReady(data: any): any {
    return console.log('\x1b[36m%s\x1b[0m', data)
}

export function logWarning(data: any): any {
    return console.log('\x1b[33m%s\x1b[0m', data)
}
