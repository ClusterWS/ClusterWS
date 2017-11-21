import { logError } from '../utils/logs'

export class EventEmitter {
    private events: any = {}

    public on(event: string, listener: any): void {
        if (!listener || typeof listener !== 'function') return logError('Listener must be a function')
        if (this.events[event]) return this.events[event].push(listener)
        this.events[event] = [listener]
    }

    public emit(event: string, ...args: any[]): void {
        const listeners: any[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++) listeners[i].call(null, ...args)
    }

    public removeListener(event: string, listener: any): void {
        const listeners: any[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++) if (listeners[i] === listener) this.events[event].splice(i, 1)
    }

    public removeEvent(event: string): void {
        this.events[event] = null
    }

    public removeEvents(): void {
        this.events = {}
    }
}