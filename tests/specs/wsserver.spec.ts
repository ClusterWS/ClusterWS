import 'mocha';
import { expect } from 'chai';
import { WSServer } from '../../src/modules/socket/wsserver';

describe('WSServer Functions Tests', () => {
  it('Test middleware set functions', (done) => {
    const wss = new WSServer();

    // Set on publish
    wss.setMiddleware('onPublish', () => done(null));
    wss.middleware.onPublish();
  });

  it('Test setBroker & publish functions', (done) => {
    const wss = new WSServer();

    const broker: any = {
      send: (msg) => {
        expect(Buffer.from(msg).toString()).to.equal(`channel%{"message":"test"}`);
        done(null);
      },
      readyState: 1
    };
    // Set broker
    wss.setBroker(broker, 'broker/url');
    // Publish message to the channel
    wss.publish('channel', 'test');
  });

  it('Test broadcastMessage function', (done) => {
    const wss = new WSServer();

    const broker: any = {
      send: (msg) => {}
    };

    wss.setBroker(broker, 'broker/url');

    // Subscribe to the channel through wss channel
    wss.channels.subscribe(
      'testchannel',
      (_, message) => {
        expect(message).to.equal(`hello world`);
        done(null);
      },
      'channelKey' // This should be user id
    );

    // Broadcast message
    wss.broadcastMessage(null, Buffer.from(`testchannel%${JSON.stringify({ message: 'hello world' })}`));
  });
});

describe('WSServer test resubsrcibtion to all channels in broker', () => {
  it('Should resubsribe new broker to all existing channels', (done) => {
    let resubscribed = 0;
    const wss = new WSServer();
    const broker: any = {
      // Should execute send event after connection to new broker
      send: (msg) => {
        if (msg === 'testchannel' || msg === '["testchannel"]') resubscribed++;
        if (resubscribed === 2) done(null);
      },
      readyState: 1
    };

    // connect broker
    wss.setBroker(broker, 'superurl');
    // Subscribe to channel
    wss.channels.subscribe('testchannel', (_, message) => {}, 'channelKey');
    // Reconnect broker
    wss.setBroker(broker, 'superurl');
  });
});

describe('WSServer test setWatcher and removeWatcher functions', () => {
  it('Should setWatcher and get message', (done) => {
    const wss = new WSServer();
    wss.setWatcher('hello world', (message) => {
      expect(message).to.equal(`i am publishing message`);
      done(null);
    });

    wss.channels.publish('hello world', 'i am publishing message');
  });

  it('Should removeWatcher and do not get message', (done) => {
    const wss = new WSServer();
    wss.setWatcher('hello world', (message) => {
      done('Should not be executed');
    });

    wss.removeWatcher('hello world');
    wss.channels.publish('hello world', 'i am publishing message');
    setTimeout(() => done(null), 500);
  });
});
