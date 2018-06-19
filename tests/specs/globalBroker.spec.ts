import 'mocha';
import { expect } from 'chai';
import { BrokerClient } from '../../src/modules/broker/client';
import { GlobalBrokerServer } from '../../src/modules/broker/global';

describe('Global Broker Create Server', () => {
  it('Broker server Should start up', (done) => {
    // reasign process done
    process.send = () => done(null);
    GlobalBrokerServer({
      masterOptions: { port: 4000 },
      key: 'key'
    });
  });
});

describe('Global Broker Websocket Authentication Tests', () => {
  it('Should not connect if wrong key is provided', (done) => {
    let fail = false;
    const broadcaster = {
      broadcastMessage: (message) => {},
      clearBroker: () => {},
      setBroker: (broker, url): void => {
        fail = true;
        done('Should not be called with wrong key');
      }
    };

    BrokerClient(`ws://localhost:4000/?token=wrong_key`, broadcaster);
    setTimeout(() => !fail && done(null), 1500);
  });

  it('Should connect and not disconnected if right key is provided', (done) => {
    const broadcaster = {
      broadcastMessage: (message) => {},
      clearBroker: () => {},
      setBroker: (broker, url): any => setTimeout(() => done(null), 1500)
    };
    BrokerClient('ws://localhost:4000/?token=key', broadcaster);
  });
});

describe('Global Broker Reconnection Test', () => {
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
    BrokerClient('ws://localhost:4000/?token=key', broadcaster);
  });
});

describe('Global Broker Register servers and send messages', () => {
  it('Should connect brokers from the same server and should not get messages on any of them', (done) => {
    let socket1;
    let socket2;
    let connected = 0;

    const broadcaster1 = {
      broadcastMessage: (message) => done('Should not be called'),
      setBroker: (broker, url): void => {
        broker.send('serverid1');
        socket1 = broker;
        connected++;

        if (connected >= 2) {
          setTimeout(() => socket1.send(Buffer.from(`helloworld%${JSON.stringify({ message: 'test me out' })}`)), 100);
        }
      },
      clearBroker: () => {}
    };

    const broadcaster2 = {
      broadcastMessage: (message) => done('Should not be called'),
      setBroker: (broker, url): void => {
        broker.send('serverid1');
        socket2 = broker;
        connected++;

        if (connected >= 2) {
          setTimeout(() => socket1.send(Buffer.from(`helloworld%${JSON.stringify({ message: 'test me out' })}`)), 100);
        }
      },
      clearBroker: () => {}
    };

    BrokerClient('ws://localhost:4000/?token=key', broadcaster1);
    BrokerClient('ws://localhost:4000/?token=key', broadcaster2);

    setTimeout(() => {
      socket1.close(1000);
      socket2.close(1000);
      done(null);
    }, 1800);
  });

  it('Should connect brokers from different servers and send messages between them', (done) => {
    let socket1;
    let socket2;
    let connected = 0;

    const broadcaster1 = {
      broadcastMessage: (message) => done('Should not be called'),
      setBroker: (broker, url): void => {
        broker.send('serverid1');
        socket1 = broker;
        connected++;

        if (connected >= 2) {
          setTimeout(() => socket1.send(Buffer.from(`helloworld%${JSON.stringify({ m: 'test me out' })}`)), 100);
        }
      },
      clearBroker: () => {}
    };

    const broadcaster2 = {
      broadcastMessage: (_, message) => {
        expect(Buffer.from(message).toString()).to.equal(`helloworld%{"m":"test me out"}`);
        socket1.close(1000);
        socket2.close(1000);
        done(null);
      },
      setBroker: (broker, url): void => {
        broker.send('serverid2');
        socket2 = broker;
        connected++;

        if (connected >= 2) {
          setTimeout(() => socket1.send(Buffer.from(`helloworld%${JSON.stringify({ m: 'test me out' })}`)), 100);
        }
      },
      clearBroker: () => {}
    };

    BrokerClient('ws://localhost:4000/?token=key', broadcaster1);
    BrokerClient('ws://localhost:4000/?token=key', broadcaster2);
  });

  it('Should connect brokers from different servers get message one time then disconnect and do not get message second time', (done) => {
    let socket1;
    let socket2;
    let connected = 0;
    let revievedMessages = 0;

    const broadcaster1 = {
      broadcastMessage: (message) => done('Should not be called'),
      setBroker: (broker, url): void => {
        broker.send('serverid1');
        socket1 = broker;
        connected++;

        if (connected >= 2) {
          setTimeout(() => socket1.send(Buffer.from(`helloworld%${JSON.stringify({ m: 'test me out' })}`)), 200);
        }
      },
      clearBroker: () => {}
    };

    const broadcaster2 = {
      broadcastMessage: (_, message) => {
        expect(Buffer.from(message).toString()).to.equal(`helloworld%{"m":"test me out"}`);
        socket2.close(1000);
        revievedMessages++;

        if (revievedMessages > 1) {
          done('Should not be called second time');
        }
        setTimeout(() => socket1.send(Buffer.from(`helloworld%${JSON.stringify({ m: 'test me out' })}`)), 100);
        setTimeout(() => done(null), 1000);
      },
      setBroker: (broker, url): void => {
        broker.send('serverid2');
        socket2 = broker;
        connected++;

        if (connected >= 2) {
          setTimeout(() => socket1.send(Buffer.from(`helloworld%${JSON.stringify({ m: 'test me out' })}`)), 200);
        }
      },
      clearBroker: () => {}
    };

    BrokerClient('ws://localhost:4000/?token=key', broadcaster1);
    BrokerClient('ws://localhost:4000/?token=key', broadcaster2);
  });
});
