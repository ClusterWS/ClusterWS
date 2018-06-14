import 'mocha';
import { expect } from 'chai';
import { BrokerClient } from '../../src/modules/broker/client';
import { GlobalBrokerServer } from '../../src/modules/broker/global';

describe('Global Broker Create Server', () => {
  it('Broker server Should start up', (done) => {
    // reasign process done
    process.send = () => done(null);
    GlobalBrokerServer(4000, 'key', null);
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
