import { Listener, Message, CustomObject } from '../../utils/types';
import { noop, native, DEFAULT_PAYLOAD_LIMIT, OPCODE_BINARY, OPCODE_PING, OPCODE_TEXT } from './static';

native.setNoop(noop);
const clientGroup: Listener = native.client.group.create(0, DEFAULT_PAYLOAD_LIMIT);

native.client.group.onConnection(
  clientGroup,
  (newExternal: CustomObject): void => {
    const webSocket: CustomObject = native.getUserData(newExternal);
    webSocket.external = newExternal;
    webSocket.internalOnOpen();
  }
);

native.client.group.onDisconnection(
  clientGroup,
  (newExternal: CustomObject, code: number, message: Message, webSocket: CustomObject): void => {
    webSocket.external = null;
    process.nextTick(
      (): void => {
        webSocket.internalOnClose(code, message);
        webSocket = null;
      }
    );

    native.clearUserData(newExternal);
  }
);

native.client.group.onError(
  clientGroup,
  (webSocket: CustomObject): void => {
    process.nextTick(
      (): void =>
        webSocket.internalOnError({
          message: 'cWs client connection error',
          stack: 'cWs client connection error'
        })
    );
  }
);

native.client.group.onMessage(
  clientGroup,
  (message: Message, webSocket: CustomObject): void => webSocket.internalOnMessage(message)
);
native.client.group.onPing(clientGroup, (message: Message, webSocket: CustomObject): void => webSocket.onping(message));
native.client.group.onPong(clientGroup, (message: Message, webSocket: CustomObject): void => webSocket.onpong(message));

export class WebSocket {
  public OPEN: number = 1;
  public CLOSED: number = 0;

  public isAlive: boolean = true;
  public external: CustomObject = noop;
  public executeOn: string;

  public onping: Listener = noop;
  public onpong: Listener = noop;
  public internalOnOpen: Listener = noop;
  public internalOnError: Listener = noop;
  public internalOnClose: Listener = noop;
  public internalOnMessage: Listener = noop;

  constructor(uri: string, external: CustomObject = null, isServeClient: boolean = false) {
    this.onpong = (): boolean => (this.isAlive = true);
    this.external = external;
    this.executeOn = isServeClient ? 'server' : 'client';
    !isServeClient &&
      native.connect(
        clientGroup,
        uri,
        this
      );
  }

  get readyState(): number {
    return this.external ? this.OPEN : this.CLOSED;
  }

  public on(eventName: string, listener: Listener): this {
    const actions: any = {
      ping: (): Listener => (this.onping = listener),
      pong: (): Listener => (this.onpong = listener),
      open: (): Listener => (this.internalOnOpen = listener),
      error: (): Listener => (this.internalOnError = listener),
      close: (): Listener => (this.internalOnClose = listener),
      message: (): Listener => (this.internalOnMessage = listener)
    };
    actions[eventName]();
    return this;
  }

  public ping(message?: Message): void {
    if (!this.external) return;
    native[this.executeOn].send(this.external, message, OPCODE_PING);
  }

  public send(message: Message, options?: CustomObject): void {
    if (!this.external) return;
    const binary: boolean = (options && options.binary) || typeof message !== 'string';
    native[this.executeOn].send(this.external, message, binary ? OPCODE_BINARY : OPCODE_TEXT, undefined);
  }

  public terminate(): void {
    if (!this.external) return;
    native[this.executeOn].terminate(this.external);
    this.external = null;
  }

  public close(code: number, reason: string): void {
    if (!this.external) return;
    native[this.executeOn].close(this.external, code, reason);
    this.external = null;
  }
}
