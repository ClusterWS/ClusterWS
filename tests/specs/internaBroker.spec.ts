import 'mocha';
import { expect } from 'chai';
import { BrokerClient } from '../../src/modules/broker/client';
import { InternalBrokerServer } from '../../src/modules/broker/internal';

// TODO: fix bug with wrong key
describe('Create Server', () => {
  it('Broker server Should start up', (done) => {
    process.send = () => done(null);
    InternalBrokerServer(3000, 'key', false);
  });
});

describe('Websocket Authentication Tests', () => {
  it('Should disconnect if wrong key provided', (done) => {
    let websocket1;
    let broadcaster1 = {
      broadcastMessage: (message) => {},
      setBroker: (br, url): void => {
        websocket1 = br;
        websocket1.on('open', () => {
          done('Should not be called with wrong url');
        });
      }
    };

    BrokerClient(`ws://localhost:3000/?token=wrong_key`, broadcaster1);
    setTimeout(() => {
      done(null);
    }, 1500);
  });

  it('Should stay connected if right key provided', (done) => {
    let websocket1;
    let broadcaster1 = {
      broadcastMessage: (message) => {},
      setBroker: (br, url): void => {
        websocket1 = br;
        websocket1.on('close', (code: number, raeson: string) => done('Should not disconnect'));
        setTimeout(() => done(null), 1500);
      }
    };
    BrokerClient('ws://localhost:3000/?token=key', broadcaster1);
  });
});

describe('Websocket Client/Server Communication Tests', () => {
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

describe('Reconnection Test', () => {
  it('Should reconnect to the Websocket on lost connection', (done) => {
    let tries = 0;
    let websocket1;
    let broadcaster1 = {
      broadcastMessage: (message) => {},
      setBroker: (br, url): void => {
        tries++;
        websocket1 = br;
        if (tries === 2) done(null);
      }
    };
    BrokerClient('ws://localhost:3000/?token=key', broadcaster1);
    setTimeout(() => websocket1.close(4001, 'Test Close'), 200);
  });
});
