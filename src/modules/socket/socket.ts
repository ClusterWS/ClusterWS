import * as WebSocket from 'uws'

import { Worker } from '../worker'

export class Socket {
  public worker: Worker
  private socket: WebSocket

  constructor(worker: Worker, socket: WebSocket) {
    this.worker = worker
    this.socket = socket

  }
}
