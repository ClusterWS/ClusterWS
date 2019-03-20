import { Worker } from '../worker';
import { WebSocket } from '@clusterws/cws';

export class Socket {
  constructor(private worker: Worker, private socket: WebSocket) { }
}