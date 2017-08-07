import * as _ from '../../../utils/fp'
import { log } from '../../../utils/common'

export function eventEmitter() {
    let events: any = {}

    let checkIfFunction = (event: string, listener: any) => typeof listener === 'function' ? _.Right.of({ event: event, listener: listener }) : _.Left.of('Listener must be function')

    let listen = (data: { event: string, listener: any }) => {
        let isEvent = events[data.event]
        isEvent ? isEvent[isEvent.length] = data.listener : events[data.event] = [data.listener]
    }

    let on: any = _.compose(_.either(log, listen), checkIfFunction)
    let emit: any = (event: string, ...rest: any[]) => events[event] ? _.map((x: any) => x.call(null, ...rest), events[event]) : ''
    let removeEvent: any = (event: string) => events[event] = null
    let removeAllEvents: any = () => events = []
    let removeListener: any = (event: string, listener: any) => _.map((currentListener: any, index: number, array: any) => {
        currentListener === listener ? array.splice(index, 1) : ''
    }, events[event])

    return { on: on, emit: emit, removeListener: removeListener, removeAllEvents: removeAllEvents, removeEvent: removeEvent }
}
