import 'mocha';
import { expect } from 'chai';

import { EventEmitterMany } from '../../src/modules/emitter/many';
import { EventEmitterSingle } from '../../src/modules/emitter/single';

describe('Event Emitter Many Tests', () => {
  let emitter: EventEmitterMany;
  before((done) => {
    emitter = new EventEmitterMany();
    done(null);
  });
  it('Should Subscribe to the event and emit event', (done) => {
    emitter.subscibe(
      'test',
      (event, testmessage) => {
        expect(testmessage).to.equal('testmessage');
        done(null);
      },
      'superkey'
    );

    emitter.publish('test', 'testmessage');
  });

  it('Should remove listener and do not call it', (done) => {
    let listener = (event) => done('Did not remove listener');
    emitter.subscibe('testListener', listener, 'secondKey');
    emitter.unsubscribe('testListener', 'secondKey');
    emitter.publish('testListener', 'Hello teset');
    setTimeout(() => done(null), 1500);
  });

  it('Should Subscribe to the same event few times and emit all of them', (done) => {
    let emitedNUmber = 0;
    emitter.subscibe(
      'manyevents',
      (event, testmessage) => {
        expect(testmessage).to.equal('testmessage');
        emitedNUmber++;
        if (emitedNUmber === 2) done(null);
      },
      'thirdKey'
    );

    emitter.subscibe(
      'manyevents',
      (event, testmessage) => {
        expect(testmessage).to.equal('testmessage');
        emitedNUmber++;
        if (emitedNUmber === 2) done(null);
      },
      'thirdKey'
    );

    emitter.publish('manyevents', 'testmessage');
  });

  it('Should call new changeChannelStatusInBroker function', (done) => {
    emitter.changeChannelStatusInBroker = (string) => done(null);
    emitter.subscibe('testnewSubscribe', (event) => {}, 'thirdKey');
  });
});

describe('Event Emitter Single Tests', () => {
  let emitter: EventEmitterSingle;
  before((done) => {
    emitter = new EventEmitterSingle();
    done(null);
  });
  it('Should Subscribe to the event and emit event', (done) => {
    emitter.on('test', (testmessage) => {
      expect(testmessage).to.equal('testmessage');
      done(null);
    });

    emitter.emit('test', 'testmessage');
  });

  it('Should remove listener and do not call it', (done) => {
    emitter.on('testListener', (event) => done('Did not remove listener'));
    emitter.removeEvents();
    emitter.emit('testListener', 'Hello teset');
    setTimeout(() => done(null), 1500);
  });

  it('Should not subscribe multipall times', (done) => {
    emitter.on('testSingle', (event) => done('Should not execute this event'));
    emitter.on('testSingle', (event) => done(null));
    emitter.emit('testSingle', 'Hello teset');
  });
});
