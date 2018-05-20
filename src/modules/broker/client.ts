import { UWebSocket } from '../uws/client';
import { logWarning, logReady, logError } from '../../utils/functions';
import { CustomObject, Message, Listener } from '../../utils/types';

// TODO: Design complete resubscribing
export function BrokerClient(
  url: string,
  securityKey: string,
  broadcaster: CustomObject,
  tries: number = 0,
  reconnected?: boolean
) {
  let websocket: CustomObject = new UWebSocket(url);

  websocket.on('open', (): void => {
    tries = 0;
    websocket.send(securityKey);
    broadcaster.setBroker(websocket, url);
    reconnected && logReady(`Broker has been connected to ${url} \n`);
  });

  websocket.on('close', (code: number, reason: string): void => {
    websocket = null;
    if (code === 4000) return logError('Can not connect to the broker wrong authorization key \n');
    logWarning(`Broker has disconnected, system is trying to reconnect to ${url} \n`);
    setTimeout(() => BrokerClient(url, securityKey, broadcaster, ++tries, true), 500);
  });

  websocket.on('error', (err: Error): void => {
    websocket = null;
    if (tries === 5)
      logWarning(`Can not connect to the Broker ${url}. System in reconnection state please check your Broker \n`);
    setTimeout(() => BrokerClient(url, securityKey, broadcaster, ++tries, reconnected || tries > 5), 500);
  });

  websocket.subscribe = websocket.unsubscribe = (channelName: string) => websocket.send(channelName);
  websocket.on('message', (message: Message): void => broadcaster.broadcastMessage(null, message));
}
