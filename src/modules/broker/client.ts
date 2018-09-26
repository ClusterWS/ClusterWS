import { Listener } from '../../utils/types';
import { WebSocket } from 'clusterws-uws';

export function createBrokerClient(url: string, broadcast: Listener): void {
  let websocketClient: WebSocket = new WebSocket(url);

  websocketClient.on('open', (): void => {
    // handle on connect
  });

  websocketClient.on('error', (): void => {
    // need to check if get error will it propogate to the close event
    console.log('Got error');
  });

  websocketClient.on('close', (code: number, reason: string): void => {
    websocketClient = null;
    console.log('Has been closed');

  });
}