import { TListener, IObject, logError } from '../utils/utils'

export class EventEmitter {
    private events: IObject = {}

    public on(event: string, listener: TListener): void {
        if ({}.toString.call(listener) !== '[object Function]') return logError('Listener must be a function')
        this.events[event] ?
            event === 'verifyConnection' ?
                this.events[event][0] = listener :
                this.events[event].push(listener) :
            this.events[event] = [listener]
    }

    public emit(event: string, ...args: any[]): void {
        const listeners: TListener[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++) listeners[i].call(null, ...args)
    }

    public removeListener(event: string, listener: TListener): any {
        const listeners: any[] = this.events[event]
        if (!listeners) return
        for (let i: number = 0, len: number = listeners.length; i < len; i++) if (listeners[i] === listener) return listeners.splice(i, 1)
    }

    public removeEvent(event: string): void {
        this.events[event] = null
    }

    public removeEvents(): void {
        this.events = {}
    }
}