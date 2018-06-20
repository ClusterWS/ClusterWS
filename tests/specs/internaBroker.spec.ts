import 'mocha';
import { expect } from 'chai';
import { BrokerClient } from '../../src/modules/broker/client';
import { InternalBrokerServer } from '../../src/modules/broker/internal';

describe('Internal Broker Create Server', () => {
  it('Broker server Should start up', (done) => {
    // reasign process done
    process.send = () => done(null);
    InternalBrokerServer(3000, 'key', false);
  });
});

describe('Internal Broker Websocket Authentication Tests', () => {
  it('Should not connect if wrong key is provided', (done) => {
    let fail = false;
    const broadcaster = {
      broadcastMessage: (message) => {},
      clearBroker: () => {},
      setBroker: (broker, url): void => {
        fail = true;
        done('Should not be called with wrong url');
      }
    };

    BrokerClient(`ws://localhost:3000/?token=wrong_key`, broadcaster);
    setTimeout(() => !fail && done(null), 1500);
  });

  it('Should connect and not disconnected if right key is provided', (done) => {
    const broadcaster = {
      broadcastMessage: (message) => {},
      clearBroker: () => {},
      setBroker: (broker, url): any => setTimeout(() => done(null), 1500)
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
        if (tries === 2) return done(null);
        setTimeout(() => broker.close(4001, 'Close for tests'), 10);
      },
      clearBroker: () => {}
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
    broadcaster1 = {
      broadcastMessage: (message) => {},
      setBroker: (br, url): void => {
        websocket1 = br;
        BrokerClient('ws://localhost:3000/?token=key', broadcaster2);
      },
      clearBroker: () => {
        websocket1 = null;
      }
    };

    broadcaster2 = {
      broadcastMessage: (message) => {},
      setBroker: (br, url): void => {
        websocket2 = br;

        // Subscribe to the test channel on each websocket
        websocket1.send('test');
        websocket2.send('test');
        done(null);
      },
      clearBroker: () => {
        websocket2 = null;
      }
    };

    BrokerClient('ws://localhost:3000/?token=key', broadcaster1);
  });

  it('Should get the right message only on Websocket2 ', (done) => {
    broadcaster1.broadcastMessage = (_, message): void => done('Should not execute broadcaster 1');
    broadcaster2.broadcastMessage = (_, message): void => {
      expect(Buffer.from(message).toString()).to.equal(`test%{"m":"hello world"}`);
      done(null);
    };

    setTimeout(() => websocket1.send(Buffer.from(`test%${JSON.stringify({ m: 'hello world' })}`)), 500);
  });

  it('Should get the right message only on Websocket1 ', (done) => {
    broadcaster1.broadcastMessage = (_, message): void => {
      expect(Buffer.from(message).toString()).to.equal(`test%{"m":"hello world"}`);
      done(null);
    };
    broadcaster2.broadcastMessage = (_, message): void => done('Should not execute broadcaster 2');

    setTimeout(() => websocket2.send(Buffer.from(`test%${JSON.stringify({ m: 'hello world' })}`)), 500);
  });

  it('Should not get any message after unsubscribe', (done) => {
    // Unsubscribe from test channel on websocket2
    websocket2.send('test');

    broadcaster1.broadcastMessage = (_, message): void => done('Should not execute broadcaster 1');
    broadcaster2.broadcastMessage = (_, message): void => done('Should not get any messages but has got one');

    setTimeout(() => done(null), 1500);
    websocket1.send(Buffer.from(`test%${JSON.stringify({ m: 'hello world' })}`));
  });
});
