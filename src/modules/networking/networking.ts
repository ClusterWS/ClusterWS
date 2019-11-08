import { noop } from '../utils';
import { Socket } from 'net';
import { Writable } from 'stream';

// Self Containing
// simple protocol to transfer data
// between node js net client and server
// with minimal overhead
//
//  1 byte                                     1/2/4 bytes                   x bytes
//  [uInt8]                                    [uInt8/uInt16/uInt32]         [message]
//  ping/pong/message length type              message length                actual message
//  0x09/0x0a/0x08/0x22/0x38                   x                             x

const PING: number = 0x09;
const PONG: number = 0x0a;

const UINT8SIZE: number = 0x08;
const UINT16SIZE: number = 0x22;
const UINT32SIZE: number = 0x38;

const EMPTY_BUFFER: Buffer = Buffer.from('');

enum ReadState {
  EVENT,
  MESSAGE_SIZE,
  MESSAGE
}

function onDrain(): void {
  // resume socket stream after draining all data
  this.socket.resume();
}

function onData(chunk: Buffer): void {
  // try to write data to reader
  // if we are unable to do that then we
  // need to stop socket stream
  if (!this.dataProcessor.write(chunk)) {
    this.socket.pause();
  }
}

function onError(err: Error): void {
  // received error from socket or dataProcessor
  // destroy connection and emit error
  // calling destroy will trigger 'close' event
  this.eventListenerMap.error(err);
  this.socket.destroy();
}

function onClose(): void {
  // read all unread data sync from underline buffer
  // and close writable stream then emit close event
  this.socket.read();
  this.dataProcessor.end();

  if (this.dataProcessor._writableState.finished || this.dataProcessor._writableState.errorEmitted) {
    return this.eventListenerMap.close();
  }
  // if we get here most likely we still have some data to process
  // error or finish will bet triggered after processing
  // last chunk of data
  this.dataProcessor.on('error', () => this.eventListenerMap.close());
  this.dataProcessor.on('finish', () => this.eventListenerMap.close());
}

export class Networking {
  private loop: boolean = true;
  private buffers: Buffer[] = [];
  private bufferedBytes: number = 0;

  private readState: ReadState = ReadState.EVENT;
  private messageSize: number = 0;
  private messageLengthBytes: number = 0;

  private dataProcessor: Writable;
  private eventListenerMap: { [key: string]: (...args: any) => void } = {
    open: noop,
    close: noop,
    message: noop,
    error: noop
  };

  constructor(private socket: Socket) {
    this.dataProcessor = new Writable({
      write: this.write.bind(this)
    });

    this.dataProcessor.on('drain', onDrain.bind(this));
    this.dataProcessor.on('error', onError.bind(this));

    this.socket.on('data', onData.bind(this));
    this.socket.on('error', onError.bind(this));
    this.socket.on('close', onClose.bind(this));

    this.socket.on('ready', () => this.eventListenerMap.open());

    this.socket.setNoDelay();
  }

  public on(event: 'error', listener: (err: Error) => void): void;
  public on(event: 'message', listener: (message: Buffer) => void): void;
  public on(event: 'open' | 'close' | 'ping' | 'pong', listener: () => void): void;
  public on(event: string, listener: (...args: any) => void): void {
    this.eventListenerMap[event] = listener;
  }

  public send(data: string | Buffer, cb?: () => void): void {
    const messageSize: number = typeof data === 'string' ? Buffer.byteLength(data) : data.byteLength;
    let offset: number = 2;

    if (messageSize > 255) {
      offset = 3;
    } else if (messageSize > 65535) {
      offset = 5;
    }

    const writeBuffer: Buffer = Buffer.allocUnsafe(offset + (typeof data === 'string' ? messageSize : 0));

    switch (offset) {
      case 2:
        writeBuffer.writeUInt8(UINT8SIZE, 0);
        writeBuffer.writeUInt8(messageSize, 1);
        break;
      case 3:
        writeBuffer.writeUInt8(UINT16SIZE, 0);
        writeBuffer.writeUInt16BE(messageSize, 1);
        break;
      case 5:
        writeBuffer.writeUInt8(UINT32SIZE, 0);
        writeBuffer.writeUInt32BE(messageSize, 1);
        break;
    }

    if (typeof data === 'string') {
      writeBuffer.write(data, offset);
      this.socket.write(writeBuffer, cb);
    } else {
      this.socket.cork();
      this.socket.write(writeBuffer);
      this.socket.write(data, cb);
      this.socket.uncork();
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

  public close(): void {
    this.socket.end();
  }

  public terminate(): void {
    this.socket.destroy();
  }

  private write(chunk: Buffer, encoding: string, cb: () => void): void {
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
              // Must send pong after receiving ping
              this.pong();
              this.eventListenerMap.ping();
              continue;
            case PONG:
              this.eventListenerMap.pong();
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
            this.eventListenerMap.message(EMPTY_BUFFER);
            continue;
          }

          this.readState = ReadState.MESSAGE;
        case ReadState.MESSAGE:
          if (this.messageSize && this.bufferedBytes < this.messageSize) {
            this.loop = false;
            return cb();
          }
          this.eventListenerMap.message(this.readBuf(this.messageSize));

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
