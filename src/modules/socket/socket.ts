import { Worker } from '../worker';
import { WebSocket } from '@clusterws/cws';
import { generateUid } from '../../utils/helpers';
import { EventEmitter } from '../../utils/emitter';
import { Message, Listener, Middleware } from '../../utils/types';

export class Socket {
  private id: string = generateUid(8);
  private emitter: EventEmitter;
  private channels: { [key: string]: boolean } = {};

  constructor(private worker: Worker, private socket: WebSocket) {
    this.emitter = new EventEmitter(this.worker.options.logger);

    if (this.worker.options.websocketOptions.sendConfigurationMessage) {
      // Initialize client socket configs
      const initMessage: Message = {
        autoPing: this.worker.options.websocketOptions.autoPing,
        ping: this.worker.options.websocketOptions.pingInterval
      };
      this.send('configuration', initMessage, 'system');
    }

    // "any" type is used to overcome private params
    (this.worker.wss as any).pubSub.register(this.id, (message: Message) => {
      // we don't have to pass event as publish messages is large object with structure { channel: [data] }
      this.send(null, message, 'publish');
    });

    this.socket.on('pong', () => {
      this.emitter.emit('pong');
    });

    this.socket.on('message', (message: string | Buffer): void => {
      // if user listens on 'message' event then we will not parse any messages
      // and just emit default websocket on message event
      if (this.emitter.exist('message')) {
        return this.emitter.emit('message', message);
      }

      this.processMessage(message);
    });

    this.socket.on('close', (code?: number, reason?: string): void => {
      (this.worker.wss as any).pubSub.unregister(this.id, Object.keys(this.channels));
      this.emitter.emit('close', code, reason);
      this.emitter.removeEvents();
      this.channels = {};
    });

    this.socket.on('error', (err: Error): void => {
      if (this.emitter.exist('error')) {
        // user can decide what to do with this error
        return this.emitter.emit('error', err);
      }
      this.worker.options.logger.error(err);
      this.socket.terminate();
    });
  }

  public get readyState(): number {
    return this.socket.readyState;
  }

  // assign listener to specific event
  public on(event: string, listener: Listener): void {
    this.emitter.on(event, listener);
  }

  // Send data with encoding to ClusterWS protocol
  public send(event: string, message: Message, eventType: string = 'emit'): void {
    this.socket.send(encode(event, message, eventType));
  }

  // Send data without encoding to ClusterWS protocol
  public sendRaw(message: string | Buffer): void {
    this.socket.send(message);
  }

  // correct way to close connection
  public close(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  // terminate connection (is used for error and no ping events)
  public terminate(): void {
    this.socket.terminate();
  }

  // below functionality is not fully ready for user exposure
  // Subscribe socket to specific channel
  public subscribe(channels: string[]): void {
    const subResponse: any = {};
    // console.log("GOt here", this.channels);
    for (let i: number = 0, len: number = channels.length; i < len; i++) {
      const channel: string = channels[i];
      subResponse[channel] = true;

      if (this.channels[channel]) {
        subResponse[channel] = false;
        continue;
      }

      if (this.worker.wss.middleware[Middleware.onSubscribe]) {
        // TODO: This wont work with async (need to fix it) :(
        // This will allow user to decide if they want to subscribe user to specific channel
        this.worker.wss.middleware[Middleware.onSubscribe](this, channel, (allow: any) => {
          if (allow) {
            this.channels[channel] = true;
            this.worker.wss.subscribe(this.id, channel);
          } else { subResponse[channel] = false; }
        });
        continue;
      }

      this.channels[channel] = true;
      this.worker.wss.subscribe(this.id, channel);
    }

    this.send('subscribe', subResponse, 'system');
  }

  // unsubscribe socket from specific channel
  public unsubscribe(channel: string): void {
    if (!this.channels[channel]) { return; }
    if (this.worker.wss.middleware[Middleware.onUnsubscribe]) {
      // This will allow user to see if some one unsubscribes from channel
      // User can not control unsubscribe from happening
      this.worker.wss.middleware[Middleware.onUnsubscribe](this, channel);
    }
    delete this.channels[channel];
    this.worker.wss.unsubscribe(this.id, channel);
  }

  public processMessage(message: Message): void {
    // Try catch is very slow when we throw error therefore we need to try and handle as much as possible error in try method
    try {
      // If message is array already we can process it
      if (message instanceof Array) {
        return decode(this as any, message);
      }
      // if message is not string then we need to get buffer
      if (typeof message !== 'string') {
        message = Buffer.from(message);
      }
      // make sure that incoming message is at least looking like correct structure
      if (message[0] !== 91 && message[0] !== '[') {
        // if it is not starting with "[" we can 100% that it is wrong structure
        if (this.emitter.exist('error')) {
          return this.emitter.emit('error', new Error('Received message is not correct structure'));
        }

        this.worker.options.logger.error('Received message is not correct structure');
        return this.terminate();
      }

      // we can try and decode message
      // JSON.parse() is actually another slow part :(
      // unfortunately we can not do anything about that
      decode(this as any, JSON.parse(message.toString() as any));
    } catch (err) {
      // we have caught some error trying to parse message try and send message to standard websocket output
      // for user to process or to error output
      if (this.emitter.exist('error')) {
        return this.emitter.emit('error', err);
      }
      this.worker.options.logger.error(err);
      this.terminate();
    }
  }
}

// encode message to ClusterWS protocol
function encode(event: string, data: Message, eventType: string): string | Buffer {
  const message: { [key: string]: any } = {
    emit: ['e', event, data],
    publish: ['p', event, data],
    system: {
      subscribe: ['s', 's', data],
      configuration: ['s', 'c', data]
    }
  };

  if (eventType === 'system') {
    return JSON.stringify(message[eventType][event]);
  }
  return JSON.stringify(message[eventType]);
}

// decode message from ClusterWS protocol
function decode(socket: Socket, data: Message): void {
  // parse data with user provided decode function
  const [msgType, param, message]: [string, string, Message] = data;

  // 'e' means emit
  if (msgType === 'e') {
    return (socket as any).emitter.emit(param, message);
  }

  // 'p' means publish
  if (msgType === 'p') {
    return (socket as any).channels[param] && (socket as any).worker.wss.publish(param, message, (socket as any).id);
  }

  // if we start with 's' it means system
  if (msgType === 's') {
    // second 's' means subscribe
    if (param === 's') {
      // we always expect to get array of channels
      return socket.subscribe(message);
    }

    // 'u' means unsubscribe
    if (param === 'u') {
      return socket.unsubscribe(message);
    }
  }
}