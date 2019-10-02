import { Socket } from 'net';

// Simple networking for tcp and unix sockets
// based on node.js net library
// '.' represents end of header with length
// message example: '1.hello world'

type Listener = (messages: string) => void;

export class Networking {
  private buf: string = '';
  private bufferLen: number = 0;
  private listener: Listener;

  constructor(private socket: Socket) {
    this.socket.on('data', (data: Buffer) => {
      this.buf += data.toString();

      if (this.bufferLen === 0) {
        // we don't know payload length yet
        for (let i: number = 0, len: number = this.buf.length; i < len; i++) {
          if (this.buf[i] === '.') {
            this.bufferLen = parseInt(this.buf.substring(0, i), 10);
            this.buf = this.buf.substring(i + 1);
            break;
          }
        }
      }

      if (this.bufferLen > 0) {
        if (this.buf.length === this.bufferLen) {
          // we have data to process
          this.listener(this.buf);
          // reset data
          this.buf = '';
          this.bufferLen = 0;
        }

        if (this.buf.length > this.bufferLen) {
          this.listener(this.buf.substring(0, this.bufferLen));

          this.buf = this.buf.substring(this.bufferLen);
          this.bufferLen = 0;
        }
      }
    });
  }

  public onMessage(listener: Listener): void {
    this.listener = listener;
  }

  public send(message: string): void {
    this.socket.write(`${message.length}.${message}`);
  }
}