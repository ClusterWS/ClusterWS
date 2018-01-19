import * as WebSocket from 'uws'
import { Listener, CustomObject, logError, Message } from '../../utils/utils'

export class EventEmitter {
    private events: CustomObject = {}

    public on(event: 'connection', listener: (socket: WebSocket) => void): void
    public on(event: string, listener: Listener): void
    public on(event: string, listener: Listener): void {
        if ({}.toString.call(listener) !== '[object Function]')
            return logError('Listener must be a function')
        this.events[event] = listener
    }

    public emit(event: string, message: Message): void
    public emit(event: string, ...args: any[]): void
    public emit(event: string, ...args: any[]): void {
        const listener: Listener = this.events[event]
        listener && listener.call(null, ...args)
    }

    public onmany(event: string, listener: Listener): void {
        if ({}.toString.call(listener) !== '[object Function]')
            return logError('Listener must be a function')
        this.events[event] ? this.events[event].push(listener) : this.events[event] = [listener]
    }

    public emitmany(event: string, ...args: any[]): void {
        const listeners: Listener[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++) listeners[i].call(null, ...args)
    }

    public removeListener(event: string, listener: Listener): any {
        const listeners: Listener[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++)
            if (listeners[i] === listener) return listeners.splice(i, 1)
    }

    public removeEvent(event: string): void {
        this.events[event] = null
    }

    public removeEvents(): void {
        this.events = {}
    }
}