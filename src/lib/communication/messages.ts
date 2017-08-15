import { _ } from '../utils/fp'

export function processMessages(type: string, data?: any) {
    return { type: type, data: data }
}

export function socketMessages(event: string, data: any, type: string) {
    return _.switchcase({
        'pub': JSON.stringify({ 'm': ['p', event, data] }),
        'emt': JSON.stringify({ 'm': ['e', event, data] }),
        'sys': JSON.stringify({ 'm': ['s', event, data] }),
        'ping': event
    })(type)
}

export function brokerMessage(channel: string, data: any) {
    return JSON.stringify({ channel: channel, data: data })
}