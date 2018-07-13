import * as HTTP from 'http';
import { UWebSocket } from './client';
import { EventEmitterSingle } from '../emitter/single';
import { Listener, Message, CustomObject } from '../../utils/types';
import { noop, native, PERMESSAGE_DEFLATE, DEFAULT_PAYLOAD_LIMIT, APP_PONG_CODE, APP_PING_CODE } from './static';

native.setNoop(noop);

export class UWebSocketsServer extends EventEmitterSingle {
  public noDelay: boolean;
  public upgradeReq: any = null;
  public httpServer: HTTP.Server;
  public serverGroup: any;
  public pingIsAppLevel: boolean;
  public upgradeCallback: any = noop;
  public lastUpgradeListener: boolean = true;

  constructor(options: CustomObject, callback?: Listener) {
    super();

    if (!options || (!options.port && !options.server && !options.noServer)) throw new TypeError('Wrong options');

    this.noDelay = options.noDelay || true;
    this.httpServer =
      options.server || HTTP.createServer((request: CustomObject, response: CustomObject) => response.end());
    this.serverGroup = native.server.group.create(
      options.perMessageDeflate ? PERMESSAGE_DEFLATE : 0,
      options.maxPayload || DEFAULT_PAYLOAD_LIMIT
    );

    if (options.path && (!options.path.length || options.path[0] !== '/')) options.path = `/${options.path}`;

    this.httpServer.on(
      'upgrade',
      (request: any, socket: any, head: any): void => {
        request.remoteAddress = socket.remoteAddress;
        if (!options.path || options.path === request.url.split('?')[0].split('#')[0]) {
          if (options.verifyClient) {
            const info: any = {
              origin: request.headers.origin,
              secure: !!(request.connection.authorized || request.connection.encrypted),
              req: request
            };

            options.verifyClient(
              info,
              (result: any, code: any, name: any): void =>
                result
                  ? this.handleUpgrade(request, socket, head, this.emitConnection)
                  : this.abortConnection(socket, code, name)
            );
          } else this.handleUpgrade(request, socket, head, this.emitConnection);
        } else if (this.lastUpgradeListener) this.abortConnection(socket, 400, 'URL not supported');
      }
    );

    this.httpServer.on('error', (err: Error) => this.emit('error', err));
    this.httpServer.on(
      'newListener',
      (eventName: string, listener: Listener) => (eventName === 'upgrade' ? (this.lastUpgradeListener = false) : null)
    );

    native.server.group.onConnection(
      this.serverGroup,
      (external: CustomObject): void => {
        const webSocket: UWebSocket = new UWebSocket(null, external, true);
        native.setUserData(external, webSocket);
        this.upgradeCallback(webSocket);
        this.upgradeReq = null;
      }
    );

    native.server.group.onMessage(
      this.serverGroup,
      (message: Message, webSocket: CustomObject): any => {
        let parsedMessage: any;
        if (this.pingIsAppLevel) {
          if (typeof message !== 'string') {
            parsedMessage = Buffer.from(message);
            if (parsedMessage[0] === APP_PONG_CODE) return (webSocket.isAlive = true);
          } else parsedMessage = message;
        } else parsedMessage = message;
        webSocket.internalOnMessage(parsedMessage);
      }
    );

    native.server.group.onDisconnection(
      this.serverGroup,
      (external: CustomObject, code: number, message: Message, webSocket: CustomObject): void => {
        webSocket.external = null;
        process.nextTick(() => {
          webSocket.internalOnClose(code, message);
          webSocket = null;
        });
        native.clearUserData(external);
      }
    );

    native.server.group.onPing(
      this.serverGroup,
      (message: Message, webSocket: UWebSocket): void => webSocket.onping(message)
    );
    native.server.group.onPong(
      this.serverGroup,
      (message: Message, webSocket: UWebSocket): void => webSocket.onpong(message)
    );

    if (!options.port) return;
    this.httpServer.listen(
      options.port,
      options.host || null,
      (): void => {
        this.emit('listening');
        callback && callback();
      }
    );
  }

  public heartbeat(interval: number, appLevel: boolean = false): void {
    if (appLevel) this.pingIsAppLevel = true;
    setTimeout(() => {
      native.server.group.forEach(this.serverGroup, this.pingIsAppLevel ? this.sendPingsAppLevel : this.sendPings);
      this.heartbeat(interval);
    }, interval);
  }

  private sendPings(ws: UWebSocket): void {
    if (ws.isAlive) {
      ws.isAlive = false;
      ws.ping();
    } else ws.terminate();
  }

  private sendPingsAppLevel(ws: UWebSocket): void {
    if (ws.isAlive) {
      ws.isAlive = false;
      ws.send(APP_PING_CODE);
    } else ws.terminate();
  }

  private emitConnection(ws: UWebSocket): void {
    this.emit('connection', ws, this.upgradeReq);
  }

  private abortConnection(socket: CustomObject, code: number, name: string): void {
    socket.end(`HTTP/1.1 ${code} ${name}\r\n\r\n`);
  }

  private handleUpgrade(
    request: CustomObject,
    socket: CustomObject,
    upgradeHead: CustomObject,
    callback: Listener
  ): void {
    if (socket._isNative) {
      if (this.serverGroup) {
        this.upgradeReq = request;
        this.upgradeCallback = callback ? callback : noop;
        native.upgrade(
          this.serverGroup,
          socket.external,
          null,
          request.headers['sec-websocket-extensions'],
          request.headers['sec-websocket-protocol']
        );
      }
    } else {
      const secKey: any = request.headers['sec-websocket-key'];
      const socketHandle: any = socket.ssl ? socket._parent._handle : socket._handle;
      const sslState: any = socket.ssl ? socket.ssl._external : null;
      if (socketHandle && secKey && secKey.length === 24) {
        socket.setNoDelay(this.noDelay);
        const ticket: any = native.transfer(socketHandle.fd === -1 ? socketHandle : socketHandle.fd, sslState);
        socket.on(
          'close',
          (error: any): void => {
            if (this.serverGroup) {
              this.upgradeReq = request;
              this.upgradeCallback = callback ? callback : noop;
              native.upgrade(
                this.serverGroup,
                ticket,
                secKey,
                request.headers['sec-websocket-extensions'],
                request.headers['sec-websocket-protocol']
              );
            }
          }
        );
      }
      socket.destroy();
    }
  }
}
