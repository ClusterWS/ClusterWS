export function processMessages(type: string, data?: any) {
    let message = { type: type, data: data }
    return message
}