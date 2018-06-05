import 'mocha';
import { expect } from 'chai';
import { WSServer } from '../../src/modules/socket/wsserver';

describe('WSServer Functions Tests', () => {
  let wss = new WSServer();

  it('Test middleware function', (done) => {
    wss.setMiddleware('onPublish', () => done(null));
    wss.middleware.onPublish();
    wss.setMiddleware('onPublish', () => {});
  });

  it('Test setBroker & publish functions', (done) => {
    let broker: any = {
      send: (msg) => {
        expect(Buffer.from(msg).toString()).to.equal(`channel1%{"message":"test"}`);
        done(null);
      },
      readyState: 1
    };
    wss.setBroker(broker, 'myurl');
    wss.publish('channel1', 'test');
  });

  it('Test broadcastMessage function', (done) => {
    let broker: any = {
      send: (msg) => {}
    };

    wss.setBroker(broker, 'myurl');
    wss.channels.subscibe(
      'testchannel',
      (_, message) => {
        expect(message).to.equal(`hello world`);
        done(null);
      },
      'My key'
    );
    wss.broadcastMessage(null, Buffer.from(`testchannel%${JSON.stringify({ message: 'hello world' })}`));
  });
});

describe('WSServer Broker Resubscribe', () => {
  let wss = new WSServer();
  it('Should resubsribe new broker to all channels', (done) => {
    let resubscribed = 0;
    let broker: any = {
      send: (msg) => {
        if (msg === 'testchannel' || msg === '["testchannel"]') {
          resubscribed++;
        }

        if (resubscribed === 2) {
          done(null);
        }
      },
      readyState: 1
    };

    wss.setBroker(broker, 'superurl');
    wss.channels.subscibe('testchannel', (_, message) => {}, 'keythree');
    wss.setBroker(broker, 'superurl');
  });
});
