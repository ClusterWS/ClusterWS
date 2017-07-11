export class EventEmitter {
    _events: any = {};
    constructor() {}

    on(event: string, listener: any) {
        if (!listener) throw 'Function must be provided';
        if (!this._events[event]) {
            this._events[event] = [];
        }
        return this._events[event].push(listener);
    }

    emit(event: string, data?: any) {
        if (this._events[event]) {
            for (let i = 0, len = this._events[event].length; i < len; i++) {
                if(typeof this._events[event][i] === 'function') {
                    this._events[event][i].call(this, data);
                }
            }
        }
    }

    removeListener(event: string, listener: any) {
        if (this._events[event]) {
            let len = this._events[event].length;
            while (len--) {
                if (this._events[event][len] === listener) {
                    this._events[event].splice(len, 1);
                }
            }
        }
        return;
    }
}