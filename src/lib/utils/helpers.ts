export function count(arr: any) {
    let size: number = 0
    for (let i: number = 0, len: number = arr.length; i < len; i++) arr[i] ? size++ : ''
    return size
}