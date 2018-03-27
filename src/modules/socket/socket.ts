import { WebSocket } from '../uws/uws'

import { Worker } from '../worker'
import { logError } from '../../utils/functions'
import { encode, decode } from './parser'
import { EventEmitterSingle } from '../emitter/single'
import { CustomObject, Listener, Message } from '../../utils/types'

export class Socket {
  public worker: Worker
  public events: EventEmitterSingle = new EventEmitterSingle()
  public channels: CustomObject = {}
  public onPublish: any

  private socket: WebSocket
  private missedPing: number = 0

  constructor(worker: Worker, socket: WebSocket) {
    this.worker = worker
    this.socket = socket
    this.onPublish = (channel: string, message: Message): void => this.send(channel, message, 'publish')

    const pingInterval: NodeJS.Timer = setInterval(
      (): void => this.missedPing++ > 2 ? this.disconnect(4001, 'No pongs') : this.send('#0', null, 'ping'),
      this.worker.options.pingInterval)

    this.send('configuration', { ping: this.worker.options.pingInterval, binary: this.worker.options.useBinary }, 'system')

    this.socket.on('error', (err: Error): void => this.events.emit('error', err))

    this.socket.on('message', (message: Message): number => {
      typeof message !== 'string' && (message = Buffer.from(message).toString())
      if (message === '#1') return this.missedPing = 0
      try {
        message = JSON.parse(message)
      } catch (e) { return logError(`PID: ${process.pid}\n${e}\n`) }
      decode(this, message)
    })

    this.socket.on('close', (code?: number, reason?: string): void => {
      clearInterval(pingInterval)
      this.events.emit('disconnect', code, reason)

      for (let i: number = 0, keys: string[] = Object.keys(this.channels), keysLength: number = keys.length; i < keysLength; i++)
        this.worker.wss.channels.removeListener(keys[i], this.onPublish)

      for (let i: number = 0, keys: string[] = Object.keys(this), keysLength: number = keys.length; i < keysLength; i++)
        this[keys[i]] = null
    })
  }

  public on(event: 'error', listener: (err: Error) => void): void
  public on(event: 'disconnect', listener: (code?: number, reason?: string) => void): void
  public on(event: string, listener: Listener): void
  public on(event: string, listener: Listener): void {
    this.events.on(event, listener)
  }

  public send(event: string, message: Message, eventType?: string): void
  public send(event: string, message: Message, eventType: string = 'emit'): void {
    this.socket.send(this.worker.options.useBinary ?
      Buffer.from(encode(event, message, eventType)) :
      encode(event, message, eventType))
  }

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason)
  }
}