import { WebSocket } from '@clusterws/cws';
import { WebSocketEngine } from '../engine';

import { generateUid, selectRandomBetween } from '../../utils/helpers';
import { Options, Message, Listener, HorizontalScaleOptions } from '../../utils/types';

// TODO: this file probably should not be in this folder
type SocketExtension = {
    id: string
};

export class ScalerConnector {
    private next: number = 0;
    private connections: Array<WebSocket & SocketExtension> = [];

    constructor(private options: Options, private publishFunction: Listener, private serverId: string) {
        const horizontalScaleOptions: HorizontalScaleOptions = this.options.scaleOptions.default.horizontalScaleOptions;
        if (horizontalScaleOptions.masterOptions) {
            const prefix: string = horizontalScaleOptions.masterOptions.tlsOptions ? 'wss' : 'ws';
            this.createConnection(`${prefix}://127.0.0.1:${horizontalScaleOptions.masterOptions.port}/?key=${horizontalScaleOptions.key || ''}`);
        }

        if (horizontalScaleOptions.scalersUrls) {
            for (let i: number = 0, len: number = horizontalScaleOptions.scalersUrls.length; i < len; i++) {
                this.createConnection(`${horizontalScaleOptions.scalersUrls[i]}/?key=${horizontalScaleOptions.key || ''}`);
            }
        }
    }

    public publish(message: Message): void {
        // TODO: implement retry logic (in future)
        if (this.next > this.connections.length - 1) {
            this.next = 0;
        }

        if (this.connections[this.next]) {
            this.connections[this.next].send(message);
        }
        this.next++;
    }

    private createConnection(url: string): void {
        const socket: WebSocket & SocketExtension = WebSocketEngine.createWebsocketClient(this.options.engine, url);

        socket.on('open', () => {
            socket.id = generateUid(8);
            // We attache 'i' for server to identify that it is init server id
            socket.send('i' + this.serverId);
            this.connections.push(socket);
            this.options.logger.debug(`Scaler client ${socket.id} is connected to ${url}`, `(pid: ${process.pid})`);
        });

        socket.on('message', (message: Message) => {
            this.options.logger.debug(`Scaler client ${socket.id} received:`, message), `(pid: ${process.pid})`;
            this.publishFunction(message);
        });

        socket.on('close', (code: number, reason: string) => {
            this.options.logger.debug(`Scaler client ${socket.id} is disconnected from ${url} code ${code}, reason ${reason}`, `(pid: ${process.pid})`);

            // this will remove connection from iteration loop
            this.removeSocketById(socket.id);

            if (code === 1000) {
                // this socket has been closed clean
                return this.options.logger.warning(`Scaler client ${socket.id} has been closed clean`);
            }

            this.options.logger.warning(`Scaler client ${socket.id} has been closed, now is reconnecting`);
            setTimeout(() => this.createConnection(url), selectRandomBetween(100, 1000));
        });

        socket.on('error', (err: any) => {
            // print error message to user if there are any
            this.options.logger.error(`Scaler client ${socket.id} got error`, err, 'now is reconnecting', `(pid: ${process.pid})`);

            // this will remove connection from iteration loop
            this.removeSocketById(socket.id);
            setTimeout(() => this.createConnection(url), selectRandomBetween(100, 1000));
        });
    }

    private removeSocketById(socketId: string): any {
        for (let i: number = 0, len: number = this.connections.length; i < len; i++) {
            if (this.connections[i].id === socketId) {
                this.connections.splice(i, 1);
                break;
            }
        }
    }
}
