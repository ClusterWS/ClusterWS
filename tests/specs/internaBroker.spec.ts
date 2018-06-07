import 'mocha';
import { expect } from 'chai';
import { BrokerClient } from '../../src/modules/broker/client';
import { InternalBrokerServer } from '../../src/modules/broker/internal';

describe('Internal Broker Create Server', () => {
  it('Broker server Should start up', (done) => {
    // reasign process done
    process.send = () => done(null);

    // Craete new internal broker server
    InternalBrokerServer(3000, 'key', false);
  });
});

describe('Internal Broker Websocket Authentication Tests', () => {
  it('Should not connect if wrong key is provided', (done) => {
    const broadcaster = {
      broadcastMessage: (message) => {},
      setBroker: (broker, url): void => broker.on('open', () => done('Should not be called with wrong url'))
    };

    BrokerClient(`ws://localhost:3000/?token=wrong_key`, broadcaster);
    setTimeout(() => done(null), 1500);
  });

  it('Should not disconnected if right key is provided', (done) => {
    const broadcaster = {
      broadcastMessage: (message) => {},
      setBroker: (broker, url): void => {
        broker.on('close', (code: number, raeson: string) => done('Should not disconnect'));
        setTimeout(() => done(null), 1500);
      }
    };
    BrokerClient('ws://localhost:3000/?token=key', broadcaster);
  });
});

describe('Internal Broker Reconnection Test', () => {
  it('Should reconnect to the WebSocket Server on lost connection', (done) => {
    let tries = 0;
    const broadcaster = {
      broadcastMessage: (message) => {},
      setBroker: (broker, url): void => {
        tries++;
        console.log(tries);
        if (tries === 2) return done(null);
        setTimeout(() => broker.close(4001, 'Close for tests'), 10);
      }
    };
    BrokerClient('ws://localhost:3000/?token=key', broadcaster);
  });
});

describe('Internal Broker Websocket Client/Server Communication Tests', () => {
  let websocket1;
  let websocket2;
  let broadcaster1;
  let broadcaster2;

  before((done) => {
    broadcaster2 = {
      broadcastMessage: (message) => {},
      setBroker: (br, url): void => {
        websocket2 = br;
        done(null);
      }
    };

    broadcaster1 = {
      broadcastMessage: (message) => {},
      setBroker: (br, url): void => {
        websocket1 = br;
        BrokerClient('ws://localhost:3000/?token=key', broadcaster2);
      }
    };

    BrokerClient('ws://localhost:3000/?token=key', broadcaster1);
  });

  it('Should get the right message only on Websocket2 ', (done) => {
    websocket1.send('test');
    websocket2.send('test');

    broadcaster1.broadcastMessage = (_, message): void => done('Should not execute broadcaster 1');
    broadcaster2.broadcastMessage = (_, message): void => {
      expect(Buffer.from(message).toString()).to.equal(`test%{"m":"hello world"}`);
      done(null);
    };

    setTimeout(() => websocket1.send(Buffer.from(`test%${JSON.stringify({ m: 'hello world' })}`)), 500);
  });

  it('Should not get any message after unsubscribe', (done) => {
    websocket2.send('test');

    broadcaster1.broadcastMessage = (_, message): void => done('Should not execute broadcaster 1');
    broadcaster2.broadcastMessage = (_, message): void => done('Should not get any messages but has got one');

    setTimeout(() => done(null), 1500);
    setTimeout(() => websocket1.send(Buffer.from(`test%${JSON.stringify({ m: 'hello world' })}`)), 500);
  });
});
