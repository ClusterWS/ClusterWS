import * as HTTPS from 'https'
import { Server } from 'uws'
import { generateKey } from '../../utils/functions'
import { CustomObject, Message } from '../../utils/interfaces'

export function BrokerServer(configs: any): void {
    let server: Server
    const sockets: CustomObject = {}
    const globalBrokers: CustomObject = {}
    const hasGlobalBrokers = configs.type && configs.type !== 'Scaler' && configs.horizontalScaleOptions

    if (configs.type && configs.type === 'Scaler' && configs.horizontalScaleOptions && configs.horizontalScaleOptions.masterOptions.tlsOptions) {
        const httpsServer: HTTPS.Server = HTTPS.createServer(configs.horizontalScaleOptions.masterOptions.tlsOptions)
        server = new Server({ server: httpsServer })
        httpsServer.listen(configs.port, () => process.send({ event: 'READY', pid: process.pid }))
    } else server = new Server({ port: configs.port })

    server.on('connection', (socket: CustomObject) => {
        let isAuth = false

        const ping: NodeJS.Timer = setInterval((): void => socket.send('#0'), 20000)
        const authTimeOut: NodeJS.Timer = setTimeout((): void => socket.close(4000, 'Not Authenticated'), 5000)

        socket.on('message', (message: Message): void => {
            if (message === '#1')
                return
            if (message === configs.key) {
                if (isAuth) return
                isAuth = true
                setSocketId(socket)
                return clearTimeout(authTimeOut)
            }
            if (isAuth) {
                broadcast(socket.id, message)
                hasGlobalBrokers && true
            }
        })

        socket.on('close', (code: number, reason: string) => {
            clearInterval(ping)
            clearTimeout(authTimeOut)
            if (isAuth) sockets[socket.id] = null
            socket = null
        })
    })

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
}

