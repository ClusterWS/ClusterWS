import { Socket } from 'net';
import { Writable } from 'stream';

// ClusterWS simple broker networking protocol
//  1 byte                                     1/2/4 bytes                   x
//  [uInt8]                                    [uInt8/uInt16/uInt32]         [message]
//  ping/pong/message length type              message length                actual message
//  0x09/0x0a/0x08/0x22/0x38                   x                             x

const PING: number = 0x09;
const PONG: number = 0x0a;
const UINT8SIZE: number = 0x08;
const UINT16SIZE: number = 0x22;
const UINT32SIZE: number = 0x38;

const EMPTY_MESSAGE: Buffer = Buffer.from('');

function NOOP(): void { /** ignore */ }

enum ReadState {
  EVENT,
  MESSAGE_SIZE,
  MESSAGE
}

export class Networking extends Writable {
  private loop: boolean = true;
  private buffers: Buffer[] = [];
  private bufferedBytes: number = 0;

  private readState: ReadState = ReadState.EVENT;
  private messageSize: number = 0;
  private messageLengthBytes: number = 0;

  private onErrorListener: any = NOOP;

  constructor(private socket: Socket) {
    super();

    super.on('drain', () => {
      // stream has been emptied time
      // can continue reading from socket
      this.socket.resume();
    });

    super.on('error', (err: Error) => {
      // error writing data to the Writable stream
      // calling destroy will trigger 'close' event
      this.onErrorListener(err);
      this.socket.destroy();
    });

    this.socket.on('ready', () => {
      // inform user that connection is established
      this.emit('open');
    });

    this.socket.on('data', (chunk: Buffer) => {
      // process data chunks
      const success: boolean = this.write(chunk);
      if (!success) {
        this.socket.pause();
      }
    });

    this.socket.on('error', (err: Error) => {
      // received error from socket
      // destroy connection and emit error
      // calling destroy will trigger 'close' event
      this.onErrorListener(err);
      this.socket.destroy();
    });

    this.socket.on('end', () => {
      // close connection
      this.socket.end();
    });

    this.socket.on('close', () => {
      // read all unread data and end connection
      // and writable stream then emit close event
      this.socket.read();
      this.end();

      if ((this as any)._writableState.finished || (this as any)._writableState.errorEmitted) {
        this.emit('close');
      } else {
        super.on('error', () => this.emit('close'));
        super.on('finish', () => this.emit('close'));
      }

    });

    this.socket.setNoDelay();
    this.socket.setTimeout(0);
  }

  public on(event: string, listener: (...args: any) => void): any {
    if (event === 'error') {
      this.onErrorListener = listener;
      return;
    }
    super.on(event, listener);
  }

  public send(data: string | Buffer, cb?: () => void): void {
    if (typeof data === 'string') {
      let offsetAlloc: number = 2;
      const messageLength: number = Buffer.byteLength(data);
      if (messageLength > 255) {
        // use uInt16
        offsetAlloc = 3;
      } else if (messageLength > 65535) {
        // use uInt32
        offsetAlloc = 5;
      }

      const buffer: Buffer = Buffer.allocUnsafe(offsetAlloc + messageLength);

      switch (offsetAlloc) {
        case 2:
          buffer.writeUInt8(UINT8SIZE, 0);
          buffer.writeUInt8(messageLength, 1);
          buffer.write(data, 2);
          break;
        case 3:
          buffer.writeUInt8(UINT16SIZE, 0);
          buffer.writeUInt16BE(messageLength, 1);
          buffer.write(data, 3);
          break;
        case 5:
          buffer.writeUInt8(UINT32SIZE, 0);
          buffer.writeUInt32BE(messageLength, 1);
          buffer.write(data, 5);
          break;
      }
      this.socket.write(buffer, cb);
    } else {
      // TODO: implement buffer size
      throw new Error('Implement buffer write');
    }
  }

  public ping(cb?: () => void): void {
    const buffer: Buffer = Buffer.allocUnsafe(1);
    buffer.writeUInt8(PING, 0);
    this.socket.write(buffer, cb);
  }

  public pong(cb?: () => void): void {
    const buffer: Buffer = Buffer.allocUnsafe(1);
    buffer.writeUInt8(PONG, 0);
    this.socket.write(buffer, cb);
  }

  public _write(chunk: Buffer, encoding: string, cb: () => void): void {
    this.bufferedBytes += chunk.length;
    this.buffers.push(chunk);
    this.loop = true;

    do {
      switch (this.readState) {
        case ReadState.EVENT:
          if (this.bufferedBytes < 1) {
            this.loop = false;
            return cb();
          }

          switch (this.readBuf(1).readUInt8(0)) {
            case PING:
              this.emit('ping');
              continue;
            case PONG:
              this.emit('pong');
              continue;
            case UINT8SIZE:
              this.messageLengthBytes = 1;
              break;
            case UINT16SIZE:
              this.messageLengthBytes = 2;
              break;
            case UINT32SIZE:
              this.messageLengthBytes = 4;
              break;
          }

          this.readState = ReadState.MESSAGE_SIZE;
        case ReadState.MESSAGE_SIZE:
          if (!this.messageSize && this.bufferedBytes < this.messageLengthBytes) {
            this.loop = false;
            return cb();
          }

          switch (this.messageLengthBytes) {
            case 1:
              this.messageSize = this.readBuf(this.messageLengthBytes).readUInt8(0);
              break;
            case 2:
              this.messageSize = this.readBuf(this.messageLengthBytes).readUInt16BE(0);
              break;
            case 4:
              this.messageSize = this.readBuf(this.messageLengthBytes).readUInt32BE(0);
              break;
          }

          if (!this.messageSize) {
            // received empty message
            this.readState = ReadState.EVENT;
            this.emit('message', EMPTY_MESSAGE);
            continue;
          }

          this.readState = ReadState.MESSAGE;
        case ReadState.MESSAGE:
          if (this.messageSize && this.bufferedBytes < this.messageSize) {
            this.loop = false;
            return cb();
          }

          this.emit('message', this.readBuf(this.messageSize));
          // message  has been completed reset everything
          this.messageSize = 0;
          this.messageLengthBytes = 0;
          this.readState = ReadState.EVENT;
      }
    } while (this.loop);
  }

  private readBuf(length: number): Buffer {
    this.bufferedBytes -= length;

    if (length === this.buffers[0].length) {
      return this.buffers.shift();
    }

    if (length < this.buffers[0].length) {
      const buf: Buffer = this.buffers[0];
      this.buffers[0] = buf.slice(length);
      return buf.slice(0, length);
    }

    const responseBuf: Buffer = Buffer.allocUnsafe(length);

    do {
      const buf: Buffer = this.buffers[0];
      const offset: number = responseBuf.length - length;

      if (length >= buf.length) {
        responseBuf.set(this.buffers.shift(), offset);
      } else {
        responseBuf.set(new Uint8Array(buf.buffer, buf.byteOffset, length), offset);
        this.buffers[0] = buf.slice(length);
      }

      length -= buf.length;
    } while (length > 0);

    return responseBuf;
  }
}
