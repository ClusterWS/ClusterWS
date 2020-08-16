// Self Containing
// simple protocol to transfer data
// between node js net client and server
//
//  1 byte                                     1/2/4 bytes                   x bytes
//  [uInt8]                                    [uInt8/uInt16/uInt32]         [message]
//  ping/pong/message length type              message length                actual message
//  0x09/0x0a/0x08/0x22/0x38                   x                             x

import { Socket } from 'net';
import { Writable } from 'stream';

const NOOP: () => void = (): void => {/** noop */ };
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

export class Networking {
  private buffers: Buffer[];
  private shouldRead: boolean;
  private bufferedBytes: number;
  private readState: ReadState;
  private dataReceiver: Writable;
  private eventListeners: { [key: string]: (...args: any[]) => void };

  private actualMessageLength: number;
  private messageSizeBytesLength: number;

  constructor(private socket: Socket) {
    this.buffers = [];
    this.shouldRead = true;
    this.bufferedBytes = 0;
    this.actualMessageLength = 0;
    this.messageSizeBytesLength = 0;
    this.readState = ReadState.EVENT;
    this.eventListeners = {
      open: NOOP,
      close: NOOP,
      message: NOOP,
      error: NOOP,
      ping: NOOP,
      pong: NOOP
    };

    const onData: (chunk: Buffer) => void = (chunk) => {
      // try to write data to dataReceiver
      // if we are unable to do so we need to pause socket stream
      // and wait for dataReceiver to darin
      if (!this.dataReceiver.write(chunk)) {
        this.socket.pause();
      }
    };

    const onReady: () => void = () => {
      this.eventListeners.open();
    };

    const onClose: () => void = () => {
      // read all unread data sync from underline buffer
      // and close writable stream then emit close event
      this.socket.read();
      this.dataReceiver.end();

      if ((this.dataReceiver as any)._writableState.finished || (this.dataReceiver as any)._writableState.errorEmitted) {
        return this.eventListeners.close();
      }
      // if we get here most likely we still have some data to process
      // error or finish will be triggered after processing
      // last chunk of data
      this.dataReceiver.on('error', (): void => this.eventListeners.close());
      this.dataReceiver.on('finish', (): void => this.eventListeners.close());
    };

    const onDrain: () => void = () => {
      // resume socket stream after draining all data in dataReceiver
      this.socket.resume();
    };

    const onError: (err: Error) => void = (err) => {
      // received error from net socket or dataReceiver will
      // destroy connection and emit error
      // calling socket.destroy() will trigger 'close' event
      this.eventListeners.error(err);
      this.socket.destroy();
    };

    this.socket.on('data', onData);
    this.socket.on('error', onError);
    this.socket.on('close', onClose);
    this.socket.on('ready', onReady);
    this.socket.setNoDelay();

    this.dataReceiver = new Writable({
      write: this.readMessage.bind(this)
    });
    this.dataReceiver.on('drain', onDrain);
    this.dataReceiver.on('error', onError);
  }

  public on(event: 'error', listener: (err: Error) => void): void;
  public on(event: 'message', listener: (message: Buffer) => void): void;
  public on(event: 'open' | 'close' | 'ping' | 'pong', listener: () => void): void;
  public on(event: string, listener: (...args: any[]) => void): void {
    this.eventListeners[event] = listener;
  }

  public ping(cb?: () => void): void {
    const buffer: Buffer = Buffer.allocUnsafe(1);
    buffer.writeUInt8(PING, 0);
    this.writeToSocket(buffer, cb);
  }

  public pong(cb?: () => void): void {
    const buffer: Buffer = Buffer.allocUnsafe(1);
    buffer.writeUInt8(PONG, 0);
    this.writeToSocket(buffer, cb);
  }

  public send(data: string | Buffer, cb?: () => void): void {
    const messageSize: number = typeof data === 'string' ? Buffer.byteLength(data) : data.byteLength;
    let offset: number = 2;

    if (messageSize > 255) {
      offset = 3;
    } else if (messageSize > 65535) {
      offset = 5;
    }

    const buffer: Buffer = Buffer.allocUnsafe(offset + (typeof data === 'string' ? messageSize : 0));

    switch (offset) {
      case 2:
        buffer.writeUInt8(UINT8SIZE, 0);
        buffer.writeUInt8(messageSize, 1);
        break;
      case 3:
        buffer.writeUInt8(UINT16SIZE, 0);
        buffer.writeUInt16BE(messageSize, 1);
        break;
      case 5:
        buffer.writeUInt8(UINT32SIZE, 0);
        buffer.writeUInt32BE(messageSize, 1);
        break;
    }

    if (typeof data === 'string') {
      buffer.write(data, offset);
      this.writeToSocket(buffer, cb);
    } else {
      this.writeToSocket(buffer);
      this.writeToSocket(data, cb);
    }
  }

  public close(): void {
    this.socket.end();
  }

  public terminate(): void {
    this.socket.destroy();
  }

  private writeToSocket(data: Buffer | string, cb?: () => void): void {
    this.socket.cork();
    this.socket.write(data, cb);
    process.nextTick(() => {
      this.socket.uncork();
    });
  }

  private readMessage(chunk: Buffer, encoding: string, cb: () => void): void {
    this.bufferedBytes += chunk.length;
    this.buffers.push(chunk);
    this.shouldRead = true;

    do {

      switch (this.readState) {
        case ReadState.EVENT:
          if (this.bufferedBytes < 1) {
            this.shouldRead = false;
            return cb();
          }

          switch (this.extractBuffer(1).readUInt8(0)) {
            case PING:
              // send pong after receiving ping
              this.pong();
              this.eventListeners.ping();
              continue;
            case PONG:
              this.eventListeners.pong();
              continue;
            case UINT8SIZE:
              this.messageSizeBytesLength = 1;
              break;
            case UINT16SIZE:
              this.messageSizeBytesLength = 2;
              break;
            case UINT32SIZE:
              this.messageSizeBytesLength = 4;
              break;
          }

          this.readState = ReadState.MESSAGE_SIZE;
        case ReadState.MESSAGE_SIZE:
          if (!this.actualMessageLength && this.bufferedBytes < this.messageSizeBytesLength) {
            this.shouldRead = false;
            return cb();
          }

          switch (this.messageSizeBytesLength) {
            case 1:
              this.actualMessageLength = this.extractBuffer(this.messageSizeBytesLength).readUInt8(0);
              break;
            case 2:
              this.actualMessageLength = this.extractBuffer(this.messageSizeBytesLength).readUInt16BE(0);
              break;
            case 4:
              this.actualMessageLength = this.extractBuffer(this.messageSizeBytesLength).readUInt32BE(0);
              break;
          }

          if (!this.actualMessageLength) {
            // received empty message
            this.readState = ReadState.EVENT;
            this.eventListeners.message(EMPTY_BUFFER);
            continue;
          }

          this.readState = ReadState.MESSAGE;
        case ReadState.MESSAGE:
          if (this.actualMessageLength && this.bufferedBytes < this.actualMessageLength) {
            this.shouldRead = false;
            return cb();
          }
          this.eventListeners.message(this.extractBuffer(this.actualMessageLength));

          this.actualMessageLength = 0;
          this.messageSizeBytesLength = 0;
          this.readState = ReadState.EVENT;
      }
    } while (this.shouldRead);
  }

  private extractBuffer(length: number): Buffer {
    this.bufferedBytes -= length;

    if (length === this.buffers[0].length) {
      return this.buffers.shift();
    }

    if (length < this.buffers[0].length) {
      const buf: Buffer = this.buffers[0];
      this.buffers[0] = buf.slice(length);
      return buf.slice(0, length);
    }

    const returnBuffer: Buffer = Buffer.allocUnsafe(length);

    do {
      const buf: Buffer = this.buffers[0];
      const offset: number = returnBuffer.length - length;

      if (length >= buf.length) {
        returnBuffer.set(this.buffers.shift(), offset);
      } else {
        returnBuffer.set(new Uint8Array(buf.buffer, buf.byteOffset, length), offset);
        this.buffers[0] = buf.slice(length);
      }

      length -= buf.length;
    } while (length > 0);

    return returnBuffer;
  }
}