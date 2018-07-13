import { UWebSocket } from '../uws/client';
import { logWarning, logReady } from '../../utils/functions';
import { CustomObject, Message } from '../../utils/types';

export function BrokerClient(url: string, broadcaster: CustomObject, tries: number = 0, reconnected?: boolean): void {
  let websocket: CustomObject = new UWebSocket(url);

  websocket.on(
    'open',
    (): void => {
      tries = 0;
      broadcaster.setBroker(websocket, url);
      reconnected && logReady(`Broker PID ${process.pid} has been connected to ${url}\n`);
    }
  );

  websocket.on(
    'close',
    (code: number, reason: string): void => {
      websocket = null;
      if (code === 1000) return logWarning(`Broker has disconnected from ${url} with code 1000\n`);
      broadcaster.clearBroker(url);
      logWarning(`Broker has disconnected, system is trying to reconnect to ${url}\n`);
      setTimeout(() => BrokerClient(url, broadcaster, ++tries, true), Math.floor(Math.random() * 1000) + 500);
    }
  );

  websocket.on(
    'error',
    (err: Error): void => {
      websocket = null;
      broadcaster.clearBroker(url);
      if (tries === 5)
        logWarning(`Can not connect to the Broker ${url}. System in reconnection please check your Broker and Token\n`);
      setTimeout(
        () => BrokerClient(url, broadcaster, ++tries, reconnected || tries > 5),
        Math.floor(Math.random() * 1000) + 500
      );
    }
  );

  websocket.on('message', (message: Message): void => broadcaster.broadcastMessage(null, message));
}
