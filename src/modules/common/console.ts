export function logReady(data: any): void {
    console.log('\x1b[36m%s\x1b[0m', data)
}

export function logError(data: any): void {
    console.log('\x1b[31m%s\x1b[0m', data)
}