import * as WebSocket from 'uws'
import { logError } from '../../utils/functions'
import { Listener, CustomObject, Message } from '../../utils/interfaces'

export class EventEmitterMany {
    private events: CustomObject = {}

    public onMany(event: string, listener: (event: string, ...args: any[]) => void): void {
        if ({}.toString.call(listener) !== '[object Function]')
            return logError('Listener must be a function')
        this.events[event] ?
            this.events[event].push(listener) : this.events[event] = [listener]
    }

    public emitMany(event: string, ...args: any[]): void {
        const listeners: Listener[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++)
            listeners[i].call(null, event, ...args)
    }

    public removeListener(event: string, listener: Listener): any {
        const listeners: Listener[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++)
            if (listeners[i] === listener)
                return listeners.splice(i, 1)
        if (listeners.length === 0) this.events[event] = null
    }

    public exist(event: string): boolean {
        return this.events[event] && this.events[event].length > 0
    }
}