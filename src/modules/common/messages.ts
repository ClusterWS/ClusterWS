import { ProcessMessage } from './interfaces'

export function processMessage(event: string, data?: any): ProcessMessage {
    return { event, data }
}

export function brokerMessage(channel: string, data?: any): any {
    return JSON.stringify({ channel, data })
}