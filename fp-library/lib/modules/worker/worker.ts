import * as _ from '../../../utils/fp'

import { tcpSocket } from '../tcp/socket'
import { Options } from '../../options'
import { createServer } from 'http'
import { log } from '../../../utils/common'



export function worker(options: Options) {
    // let connectHTTP = () => createServer().listen(options.port, () => {

    // })
    // let connectBroker = () => {
    //     log(options.brokerPort)
    //     setTimeout(() => {
    //         let broker = tcpSocket(options.brokerPort, 'localhost')
    //         broker.on('message', (msg: any) => {
    //             log(msg)
    //         })
    //     }, 2000)


    // }

    // _.compose(connectBroker, connectHTTP)()
}