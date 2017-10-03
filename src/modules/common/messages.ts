import { ProcessMessage } from './interfaces'
import { stringify } from './json'
export function processMessage(event: string, data?: any): ProcessMessage {
    return { event, data }
}

export function brokerMessage(channel: string, data?: any): any {
    return stringify({ channel, data })
}