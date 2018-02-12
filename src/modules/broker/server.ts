import * as HTTPS from 'https'
import { Server } from 'uws'
import { BrokerClient } from './client'
import { logError, generateKey } from '../../utils/functions'
import { CustomObject, Message, BrokerServerConfigs, BrokersObject } from '../../utils/interfaces'

export function BrokerServer(configs: BrokerServerConfigs): void {
    let server: Server
    const sockets: CustomObject = {}
    const globalBrokers: BrokersObject = {
        brokers: {},
        nextBroker: -1,
        brokersKeys: [],
        brokersAmount: 0
    }

    if (configs.type === 'Scaler' && configs.horizontalScaleOptions && configs.horizontalScaleOptions.masterOptions.tlsOptions) {
        const httpsServer: HTTPS.Server = HTTPS.createServer(configs.horizontalScaleOptions.masterOptions.tlsOptions)
        server = new Server({ server: httpsServer })
        httpsServer.listen(configs.port, () => process.send({ event: 'READY', pid: process.pid }))
    } else server = new Server({ port: configs.port }, (): void => process.send({ event: 'READY', pid: process.pid }))

    server.on('connection', (socket: CustomObject) => {
        let isAuth: boolean = false
        const ping: NodeJS.Timer = setInterval((): void => socket.send('#0'), 20000)
        const authTimeOut: NodeJS.Timer = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)

        socket.on('message', (message: Message): void => {
            if (message === '#1') return
            if (message === configs.key) {
                if (isAuth) return
                isAuth = true
                setSocketId(socket)
                return clearTimeout(authTimeOut)
            }
            if (isAuth) {
                broadcast(socket.id, message)
                configs.type !== 'Scaler' &&
                    configs.horizontalScaleOptions &&
                    globalBrokersBroadcast(message)
            }
        })

        socket.on('close', (code: number, reason: string) => {
            clearInterval(ping)
            clearTimeout(authTimeOut)
            if (isAuth) sockets[socket.id] = null
            socket = null
        })
    })

    connectGlobalBrokers()

    function broadcast(id: string, message: Message): void {
        for (const key in sockets)
            key !== id && sockets[key] && sockets[key].send(message)
    }

    function setSocketId(socket: CustomObject): void {
        socket.id = generateKey(16)
        if (sockets[socket.id])
            return setSocketId(socket)
        sockets[socket.id] = socket
    }

    function connectGlobalBrokers(): void {
        if (configs.type !== 'Scaler' && configs.horizontalScaleOptions) {
            configs.horizontalScaleOptions.masterOptions &&
                createClient((configs.horizontalScaleOptions.masterOptions.tlsOptions
                    ? 'wss' : 'ws') + '://127.0.0.1:' + configs.horizontalScaleOptions.masterOptions.port, configs.horizontalScaleOptions.key)
            for (let i: number = 0, len: number = configs.horizontalScaleOptions.brokersUrls.length; i < len; i++)
                createClient(configs.horizontalScaleOptions.brokersUrls[i], configs.horizontalScaleOptions.key)
        }
    }

    function globalBrokersBroadcast(message: Message): void {
        if (globalBrokers.brokersAmount <= 0) return
        globalBrokers.nextBroker >= globalBrokers.brokersAmount - 1 ? globalBrokers.nextBroker = 0 : globalBrokers.nextBroker++
        if (globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]].readyState !== 1) {
            delete globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]]
            globalBrokers.brokersKeys = Object.keys(globalBrokers.brokers)
            globalBrokers.brokersAmount--
            return globalBrokersBroadcast(message)
        }
        globalBrokers.brokers[globalBrokers.brokersKeys[globalBrokers.nextBroker]].send(message)
    }

    function createClient(brokerUrl: string, key: string = ''): void {
        BrokerClient({
            key,
            external: true,
            url: brokerUrl,
            broadcaster: {
                broadcastMessage: broadcast,
                setBroker: (br: WebSocket, url: string): void => {
                    globalBrokers.brokers[url] = br
                    globalBrokers.brokersKeys = Object.keys(globalBrokers.brokers)
                    globalBrokers.brokersAmount = globalBrokers.brokersKeys.length
                }
            }
        })
    }
}