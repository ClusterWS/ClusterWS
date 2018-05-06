import { UWebSocket } from '../uws/uws.client'

import { Worker } from '../worker'
import { logError } from '../../utils/functions'
import { encode, decode } from './parser'
import { EventEmitterSingle } from '../emitter/single'
import { CustomObject, Listener, Message } from '../../utils/types'

export class Socket {
  public worker: Worker
  public events: EventEmitterSingle = new EventEmitterSingle()
  public channels: CustomObject = {}
  public onPublishEvent: (...args: any[]) => void

  private socket: UWebSocket

  constructor(worker: Worker, socket: UWebSocket) {
    this.worker = worker
    this.socket = socket
    this.onPublishEvent = (channel: string, message: Message): void => this.send(channel, message, 'publish')

    this.send('configuration', { ping: this.worker.options.pingInterval, binary: this.worker.options.useBinary }, 'system')

    this.socket.on('error', (err: Error): void => this.events.emit('error', err))
    this.socket.on('message', (message: Message): void => {
      try {
        message = JSON.parse(message)
        decode(this, message)
      } catch (e) { return logError(`PID: ${process.pid}\n${e}\n`) }
    })

    this.socket.on('close', (code?: number, reason?: string): void => {
      this.events.emit('disconnect', code, reason)

      for (let i: number = 0, keys: string[] = Object.keys(this.channels), keysLength: number = keys.length; i < keysLength; i++)
        this.worker.wss.channels.removeListener(keys[i], this.onPublishEvent)

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
    message = this.worker.options.encodeDecodeEngine ?
      this.worker.options.encodeDecodeEngine.encode(message) : message

    this.socket.send(this.worker.options.useBinary ?
      Buffer.from(encode(event, message, eventType)) :
      encode(event, message, eventType))
  }

  public disconnect(code?: number, reason?: string): void {
    this.socket.close(code, reason)
  }

  public terminate(): void {
    this.socket.terminate()
  }
}