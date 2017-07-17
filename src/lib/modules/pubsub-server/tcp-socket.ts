import { EventEmitter } from '../eventEmitter/eventEmitter';
import { Socket, connect } from 'net';

/**
 * Simple helper to send and get data trough node js tcp socket.
 */
export class TcpSocket extends EventEmitter {
    socket: Socket;
    dataBuffer: string = '';

    constructor(public port: any, public host?: string) {
        super();
        if (port instanceof Socket) {
            this.socket = port;
        } else {
            this.socket = connect(port, host);
        }

        this.socket.on('connect', () => {
            this.emit('connect');
        });

        this.socket.on('data', (data) => {
            let str = data.toString();
            let i: number = str.indexOf('\n');
            if (i === -1) {
                this.dataBuffer += str;
                return;
            }
            this.emit('message', this.dataBuffer + str.slice(0, i));
            let nextPart = i + 1;
            while ((i = data.indexOf('\n', nextPart)) !== -1) {
                this.emit('message', str.slice(nextPart, i));
                nextPart = i + 1;
            }
            this.dataBuffer = str.slice(nextPart);
        });

        this.socket.on('end', () => {
            this.emit('disconnect');
        });

        this.socket.on('error', (err) => {
            this.emit('error', err);
        });
    }

    /**
     * Send data through tpc socket with '\n' symbol.
     * '\n' needed for proper parsing of the data
     */
    send(data: any) {
        this.socket.write(data + '\n');
    }
}