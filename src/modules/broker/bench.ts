/* tslint:disable */
import { WSEngine } from '../engine';
import { BrokerServer } from './server';
import { BrokerClient } from './client';

if (process.argv[2] === '--client') {
  let iter: number = 0;
  let received: number = 0;
  let largestTimeDelay: number = 0;

  const client: BrokerClient = new BrokerClient({
    url: 'ws://localhost:3000',
    engine: WSEngine.WS,
    onRegister: (): void => {
      console.log('Connect');
      // subscribe to 100000
      client.send('stimestamp');

      for (let i: number = 0; i < 1000000; i++) {
        client.send('snew_channel' + i);
      }

      setInterval(() => {
        let message: any = {};
        for (let i: number = iter; i < 1000 + iter; i++) {
          message['new_channel' + i] = ['hello', 'super', 'world', 'i am ', 'here'];
        }
        iter += 1000;

        if (iter > 1000000) {
          iter = 0;
        }

        message.timestamp = new Date().getTime();
        client.send(JSON.stringify(message));
      }, 10);
    },
    onUnregister: (): void => {
      console.log('Connection lost');
    },
    onMessage: (message: string): void => {
      let parsed: any = JSON.parse(message);
      let diff: number = new Date().getTime() - parsed.timestamp;
      if (diff > largestTimeDelay) {
        largestTimeDelay = diff;
      }
      received++;
      // console.log('Received message', message);
    }
  });

  setInterval(() => {
    console.log('Messages received', received);
    console.log('Max time delay', largestTimeDelay + 'ms');
    received = 0;
    largestTimeDelay = 0;
  }, 10000);

} else {

  new BrokerServer({
    port: 3000,
    engine: WSEngine.WS,
    onMetrics: (data: any): void => {
      // metrics are submitted every 10s
      console.log(data);
    },
    onError: (isServer: boolean, err: Error): void => {
      if (isServer) {
        return console.log(`Received error from server: ${err.stack || err.message}`);
      }

      console.log(`Received error from client`);
    },
    onReady: (): void => {
      console.log('Server is running');
    }
  });

}
