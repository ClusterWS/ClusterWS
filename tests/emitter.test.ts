import 'mocha';
import { expect } from 'chai';

import { EventEmitterMany } from '../src/modules/emitter/many';
import { EventEmitterSingle } from '../src/modules/emitter/single';

describe('Event Emitter Many', () => {
  let a: EventEmitterMany;
  before((done) => {
    a = new EventEmitterMany();
    done(null);
  });
  it('Should Subscribe to the event and emit event', (done) => {
    a.onMany('test', (event, testmessage) => {
      expect(testmessage).to.equal('testmessage');
      done(null);
    });

    a.emitMany('test', 'testmessage');
  });

  it('Should remove listener and do not call it', (done) => {
    let listener = (event) => {
      done('Did not remove listener');
    };
    a.onMany('testListener', listener);
    a.removeListener('testListener', listener);
    a.emitMany('testListener', 'Hello teset');

    setTimeout(() => {
      done(null);
    }, 1500);
  });
});
