import 'mocha';
import { expect } from 'chai';
import { WSServer } from '../src/modules/socket/wsserver';

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
});
