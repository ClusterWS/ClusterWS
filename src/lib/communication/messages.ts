import { _ } from '../utils/fp'

export function processMessages(type: string, data?: any) {
    return { type: type, data: data }
}

export function socketMessages(event: string, data: any, type: string) {
    return _.switchcase({
        'ping': event,
        'publish': JSON.stringify({ 'm': ['p', event, data] }),
        'emit': JSON.stringify({ 'm': ['e', event, data] }),
        'system': _.switchcase({
            'subsribe': JSON.stringify({ 'm': ['s', 's', data] }),
            'unsubscribe': JSON.stringify({ 'm': ['s', 'u', data] }),
            'configuration': JSON.stringify({ 'm': ['s', 'c', data] })
        })(event)
    })(type)
}

export function brokerMessage(channel: string, data: any) {
    return JSON.stringify({ channel: channel, data: data })
}