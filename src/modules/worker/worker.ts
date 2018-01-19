import { Options } from '../../utils/utils'
import { BrokerClient } from '../broker/broker'
import { WSServer } from './socket/wsserver'

export class Worker {
    public wss: WSServer = new WSServer()

    constructor(public options: Options, key: string) {
        // Change false to the broadcaster
        for (let i: number = 0; i < options.brokers; i++)
            BrokerClient('ws://127.0.0.1:' + this.options.brokersPorts[i], key, this.wss)
    }
}