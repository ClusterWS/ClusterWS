import * as _ from '../../../utils/fp'
import { log } from '../../../utils/common'

let eventEmitter: any = () => {
    let events: any = {}
    let checkIfFunction = _.curry((event: string, listener: any) => typeof listener === 'function' ? _.Right({ event: event, listener: listener }) : _.Left('Listener must be function'))
    let exist = (event: string) => events[event]
    return () => {
        let on: any = _.compose(_.either(log, (data: { event: string, listener: any }) => {
            let isEvent = exist(data.event)
            return isEvent ? isEvent[isEvent.length] = data.listener : events[data.event] = [data.listener]
        }), checkIfFunction)

        let emit: any = (event: string, ...rest: any[]) => {
            let isEvent = exist(event)
            isEvent ? _.map((x: any) => x.call(null, ...rest), isEvent) : ''
        }

        let removeListener: any = (event: string, listener: any) => {
            let isEvent = exist(event)
            if (isEvent) {
                let len = isEvent.length
                while (len--) isEvent[len] === listener ? isEvent.splice(len, 1) : ''
            }
        }

    }
}