import * as _ from '../../../utils/fp'
import { Options } from '../../options'
import { log, logError } from '../../../utils/common'
import { tcpSocket } from '../tcp/socket'
import { createServer } from 'net'

export function broker(options: Options) {
    let servers: any[]

    let on = _.curry((type: any, fn: any, data: { server: any, id: number }) => {
        data.server.on(type, fn(data.id))
        return data
    })

    let connectBroker = _.curry((options: Options, fn: any) => createServer(fn).listen(options.brokerPort))
    let switchSocket = (server: any) => tcpSocket(server)

    let runPing = (data: { server: any, id: number }) => data.server.pingInterval = setInterval(() => data.server.send('_0'), 20000)

    let addSocket = (server: any) => {
        let length: number = servers.length
        servers[length] = server
        return { server: server, id: length }
    }

    let onMessage = (id: number) => (msg: any) => msg === '_1' ? '' : broadcast(id, msg)
    let onDisconnect = (id: number) => () => logError('Worker ' + id + ' has disconnected from broker')
    let onError = (id: number) => (err: any) => logError('Broker ' + id + ': ' + err)

    let broadcast = (id: number, msg: any) => _.map((server: any, index: number) => id !== index ? server.send(msg) : '', servers)

    let handleSockets = (server: any) => _.compose(runPing, on('error', onError), on('disconnect', onDisconnect), on('message', onMessage), addSocket)

    return connectBroker(options, _.compose(handleSockets, switchSocket))
}