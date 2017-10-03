import { ProcessMessage } from './interfaces'

export function processMessage(event: string, data?: any): ProcessMessage {
    return { event, data }
}

export function brokerMessage(channel: string, data?: any): any {
    return JSON.stringify({ channel, data })
}


export function socketEncodeMessages(event: string, data: any, type: string): any {
    switch (type) {
        case 'ping': return event
        case 'emit': return JSON.stringify({ '#': ['e', event, data] })
        case 'publish': return JSON.stringify({ '#': ['p', event, data] })
        case 'system': switch (event) {
            case 'subsribe': return JSON.stringify({ '#': ['s', 's', data] })
            case 'unsubscribe': return JSON.stringify({ '#': ['s', 'u', data] })
            case 'configuration': return JSON.stringify({ '#': ['s', 'c', data] })
        }
    }
}


export function socketDecodeMessages(event: string, data: any, type: string) {

}