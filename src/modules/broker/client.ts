import { UWebSocket } from '../uws/client';
import { CustomObject, Message, Listener } from '../../utils/types';

export function BrokerClient(url: string, securityKey: string, broadcaster: CustomObject) {
  let websocket: CustomObject = new UWebSocket(url);

  websocket.on('open', (): void => {
    websocket.send(securityKey);
    broadcaster.setBroker(websocket, url);
  });

  websocket.on('close', (code: number, reason: string): void => {
    console.log('Websocket was closed', code + ' ' + reason);
  });

  websocket.on('error', (err: Error): void => {
    console.log('Websocket Error', err);
  });

  websocket.subscribe = websocket.unsubscribe = (channelName: string) => websocket.send(channelName);
  websocket.on('message', (message: Message): void => broadcaster.broadcastMessage(null, message));
}
