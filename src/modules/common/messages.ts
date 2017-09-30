import { ProcessMessage } from './interfaces'
export function processMessage(event: string, data?: any): ProcessMessage {
    return { event, data }
}