// tslint:disable:max-classes-per-file
import * as HTTP from 'http'
import { EventEmitterSingle } from '../emitter/single'
import { Listener, Message, CustomObject } from '../../utils/types'

// tslint:disable-next-line
const noop: Listener = (): void => { }

const OPEN: number = 1
const CLOSED: number = 0
const OPCODE_TEXT: number = 1
const OPCODE_PING: number = 9
const OPCODE_BINARY: number = 2
const PERMESSAGE_DEFLATE: number = 1
const DEFAULT_PAYLOAD_LIMIT: number = 16777216
const APP_PING_CODE: any = Buffer.from('9')
const APP_PONG_CODE: number = 65

const native: any = ((): void => {
  try {
    return require(`./node/uws_${process.platform}_${process.versions.modules}`)
  } catch (e) {
    const version: number[] = process.version.substring(1).split('.').map((n: any) => parseInt(n, 10))
    const lessThanSixFour: boolean = version[0] < 6 || (version[0] === 6 && version[1] < 4)

    if (process.platform === 'win32' && lessThanSixFour)
      throw new Error('µWebSockets requires Node.js 6.4.0 or greater on Windows.')
    throw new Error('Could not run µWebSockets bindings')
  }
})()

native.setNoop(noop)

export class WebSocket {
  public onping: Listener = noop
  public onpong: Listener = noop
  public isAlive: boolean = true
  public external: Listener | CustomObject = noop
  public clientGroup: any = noop
  public websocketType: string
  public internalOnOpen: Listener = noop
  public internalOnError: Listener = noop
  public internalOnClose: Listener = noop
  public internalOnMessage: Listener = noop

  constructor(uri: string, external: CustomObject = null, websocketType: string = 'client') {
    this.external = external
    this.websocketType = websocketType

    this.onpong = (): boolean => this.isAlive = true

    if (this.websocketType === 'client') {
      this.clientGroup = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT)
      native.connect(this.clientGroup, uri, this)

      native.client.group.onConnection(this.clientGroup, (newExternal: CustomObject): void => {
        const webSocket: CustomObject = native.getUserData(newExternal)
        webSocket.external = newExternal
        webSocket.internalOnOpen()
      })
      native.client.group.onMessage(this.clientGroup, (message: Message, webSocket: CustomObject): void => webSocket.internalOnMessage(message))
      native.client.group.onPing(this.clientGroup, (message: Message, webSocket: CustomObject): void => webSocket.onping(message))
      native.client.group.onPong(this.clientGroup, (message: Message, webSocket: CustomObject): void => webSocket.onpong(message))
      native.client.group.onError(this.clientGroup, (webSocket: CustomObject): void => process.nextTick((): void => webSocket.internalOnError({
        message: 'uWs client connection error',
        stack: 'uWs client connection error'
      })))
      native.client.group.onDisconnection(this.clientGroup, (newExternal: CustomObject, code: number, message: Message, webSocket: CustomObject): void => {
        webSocket.external = null
        process.nextTick((): void => webSocket.internalOnClose(code, message))
        native.clearUserData(newExternal)
      })
    }
  }

  get OPEN(): number {
    return OPEN
  }

  get CLOSED(): number {
    return CLOSED
  }

  get readyState(): number {
    return this.external ? OPEN : CLOSED
  }

  public on(eventName: string, listener: Listener): this {
    const actions: any = {
      ping: (): Listener => this.onping = listener,
      pong: (): Listener => this.onpong = listener,
      open: (): Listener => this.internalOnOpen = listener,
      error: (): Listener => this.internalOnError = listener,
      close: (): Listener => this.internalOnClose = listener,
      message: (): Listener => this.internalOnMessage = listener
    }
    actions[eventName]()
    return this
  }

  public ping(message?: Message): void {
    if (this.external) {
      this.websocketType === 'client' ?
        native.client.send(this.external, message, OPCODE_PING) :
        native.server.send(this.external, message, OPCODE_PING)
    }
  }

  public send(message: Message, options?: CustomObject): void {
    if (this.external) {
      const binary: boolean = options && options.binary || typeof message !== 'string'
      this.websocketType === 'client' ?
        native.client.send(this.external, message, binary ? OPCODE_BINARY : OPCODE_TEXT, undefined) :
        native.server.send(this.external, message, binary ? OPCODE_BINARY : OPCODE_TEXT, undefined)
    }
  }

  public terminate(): void {
    if (this.external) {
      this.websocketType === 'client' ?
        native.client.terminate(this.external) :
        native.server.terminate(this.external)
      this.external = null
    }
  }

  public close(code: number, reason: string): void {
    if (this.external) {
      this.websocketType === 'client' ?
        native.client.close(this.external, code, reason) :
        native.server.close(this.external, code, reason)
      this.external = null
    }
  }
}

export class WebSocketServer extends EventEmitterSingle {
  public noDelay: any
  public upgradeReq: any = null
  public httpServer: HTTP.Server
  public serverGroup: any
  public pingIsAppLevel: boolean = false
  public upgradeCallback: any = noop
  public upgradeListener: any = null
  public passedHttpServer: any
  public lastUpgradeListener: boolean = true

  constructor(options: CustomObject, callback?: Listener) {
    super()

    if (!options || (!options.port && !options.server && !options.noServer))
      throw new TypeError('Wrong options')

    this.noDelay = options.noDelay || true
    this.passedHttpServer = options.server

    const nativeOptions: number = options.perMessageDeflate ? PERMESSAGE_DEFLATE : 0
    this.serverGroup = native.server.group.create(nativeOptions, options.maxPayload || DEFAULT_PAYLOAD_LIMIT)

    this.httpServer = options.server || HTTP.createServer((request: CustomObject, response: CustomObject) => response.end())

    if (options.path && (!options.path.length || options.path[0] !== '/'))
      options.path = `/${options.path}`

    this.httpServer.on('upgrade', this.upgradeListener = ((request: any, socket: any, head: any): void => {
      if (!options.path || options.path === request.url.split('?')[0].split('#')[0]) {
        if (options.verifyClient) {
          const info: any = {
            origin: request.headers.origin,
            secure: !!(request.connection.authorized || request.connection.encrypted),
            req: request
          }

          if (options.verifyClient.length === 2) {
            options.verifyClient(info, (result: any, code: any, name: any): void => result ?
              this.handleUpgrade(request, socket, head, this.emitConnection) :
              this.abortConnection(socket, code, name))
          } else {
            options.verifyClient(info) ?
              this.handleUpgrade(request, socket, head, this.emitConnection) :
              this.abortConnection(socket, 400, 'Client verification failed')
          }

        } else this.handleUpgrade(request, socket, head, this.emitConnection)
      } else if (this.lastUpgradeListener) this.abortConnection(socket, 400, 'URL not supported')
    }))

    this.httpServer.on('error', (err: any) => this.emit('error', err))
    this.httpServer.on('newListener', (eventName: any, listener: Listener) => eventName === 'upgrade' ? this.lastUpgradeListener = false : null)

    native.server.group.onConnection(this.serverGroup, (external: CustomObject): void => {
      const webSocket: WebSocket = new WebSocket(null, external, 'server')
      native.setUserData(external, webSocket)
      this.upgradeCallback(webSocket)
      this.upgradeReq = null
    })

    native.server.group.onMessage(this.serverGroup, (message: Message, webSocket: CustomObject): any => {
      if (this.pingIsAppLevel) {
        if (typeof message !== 'string')
          message = Buffer.from(message)

        if (message[0] === APP_PONG_CODE)
          return webSocket.isAlive = true
      }

      webSocket.internalOnMessage(message)
    })
    native.server.group.onDisconnection(this.serverGroup, this.onDisconnection)
    native.server.group.onPing(this.serverGroup, this.onPing)
    native.server.group.onPong(this.serverGroup, this.onPong)

    if (options.port) {
      this.httpServer.listen(options.port, options.host || null, (): void => {
        this.emit('listening')
        callback && callback()
      })
    }
  }

  public keepAlive(interval: number, appLevel: boolean = false): void {
    if (appLevel)
      this.pingIsAppLevel = true
    setTimeout(() => {
      native.server.group.forEach(this.serverGroup, this.pingIsAppLevel ? this.sendPingsAppLevel : this.sendPings)
      this.keepAlive(interval)
    }, interval)
  }

  private sendPings(ws: WebSocket): void {
    if (ws.isAlive) {
      ws.isAlive = false
      ws.ping()
    } else ws.terminate()
  }

  private sendPingsAppLevel(ws: WebSocket): void {
    if (ws.isAlive) {
      ws.isAlive = false
      ws.send(APP_PING_CODE)
    } else ws.terminate()
  }

  private onPing(message: Message, webSocket: WebSocket): void {
    webSocket.onping(message)
  }

  private onPong(message: Message, webSocket: WebSocket): void {
    webSocket.onpong(message)
  }

  private onDisconnection(external: CustomObject, code: number, message: Message, webSocket: CustomObject): void {
    webSocket.external = null
    process.nextTick(() => webSocket.internalOnClose(code, message))
    native.clearUserData(external)
  }

  private emitConnection(ws: CustomObject): void {
    this.emit('connection', ws)
  }

  private abortConnection(socket: CustomObject, code: number, name: string): void {
    socket.end(`HTTP/1.1 ${code} ${name}\r\n\r\n`)
  }

  private handleUpgrade(request: CustomObject, socket: CustomObject, upgradeHead: CustomObject, callback: Listener): void {
    if (socket._isNative) {
      if (this.serverGroup) {
        this.upgradeReq = request
        this.upgradeCallback = callback ? callback : noop
        native.upgrade(this.serverGroup, socket.external, null, request.headers['sec-websocket-extensions'], request.headers['sec-websocket-protocol'])
      }
    } else {
      const secKey: any = request.headers['sec-websocket-key']
      const socketHandle: any = socket.ssl ? socket._parent._handle : socket._handle
      const sslState: any = socket.ssl ? socket.ssl._external : null
      if (socketHandle && secKey && secKey.length === 24) {
        socket.setNoDelay(this.noDelay)
        const ticket: any = native.transfer(socketHandle.fd === -1 ? socketHandle : socketHandle.fd, sslState)
        socket.on('close', (error: any): void => {
          if (this.serverGroup) {
            this.upgradeReq = request
            this.upgradeCallback = callback ? callback : noop
            native.upgrade(this.serverGroup, ticket, secKey, request.headers['sec-websocket-extensions'], request.headers['sec-websocket-protocol'])
          }
        })
      }
      socket.destroy()
    }
  }
}