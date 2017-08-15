export let count: any = (arr: any) => {
    let size: number = 0
    for (let i: number = 0, len: number = arr.length; i < len; i++) arr[i] ? size++ : ''
    return size
}
export let logError: any = (text: any) => console.log('\x1b[31m%s\x1b[0m', text)
export let logDebug: any = (text: any) => process.env.DEBUG ? console.log('DEBUG: ', text) : ''
export let logRunning: any = (text: any) => console.log('\x1b[36m%s\x1b[0m', text)