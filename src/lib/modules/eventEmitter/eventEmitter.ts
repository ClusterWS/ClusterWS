/**
 * Custom event emitter 
 */

export class EventEmitter {
    _events: any = {};

    constructor() { }

    on(event: string, listener: any) {
        if (!listener && typeof listener === 'function') throw 'Function must be provided';
        this._events[event] = this._events[event] || [];
        this._events[event].push(listener);
    }

    emit(event: string, ...rest: any[]) {
        if (this.exist(event)) {
            for (let i = 0, len = this._events[event].length; i < len; i++) {
                this._events[event][i].apply(this, rest);
            }
        }
    }

    removeListener(event: string, listener: any) {
        if (this.exist(event)) {
            let len = this._events[event].length;
            while (len--) {
                if (this._events[event][len] === listener) {
                    this._events[event].splice(len, 1);
                }
            }
        }
        return;
    }

    removeEvent(event: string) {
        if (this.exist(event)) {
            this._events[event] = null;
            delete this._events[event];
        }
    }

    removeAllEvents() {
        for (let key in this._events) {
            if (this._events.hasOwnProperty(key)) {
                this._events[key] = null;
                delete this._events[key];
            }
        }
    }

    exist(event: string) {
        return this._events[event]
    }
}

