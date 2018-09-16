/* tslint:disable */
import 'mocha';
import { expect } from 'chai';
import { stdout } from 'test-console';
import * as proxyquire from 'proxyquire';

const rootFile = './processes.ts';
const depReplace = {
  'cluster': {
    fork: () => ({ on: () => { } }),
  },
};


describe('processes.ts', () => {
  it('Should create new processes as number of brokers if no Scaler', () => {
    let numberOfBrokerProcesses = 0;
    let numberOfScalerProcesses = 0;

    depReplace.cluster.fork = () => ({
      on: () => { },
      send: (obj) => {
        if (obj.processName === 'Broker') {
          numberOfBrokerProcesses++;
        }
        if (obj.processName === 'Scaler') {
          numberOfScalerProcesses++
        }
      }
    });
    const processes = proxyquire.noCallThru()(rootFile, depReplace);
    processes.masterProcess({ brokers: 5 });
    expect(numberOfScalerProcesses).deep.equal(0, 'Scaler should not be provided');
    expect(numberOfBrokerProcesses).deep.equal(5, 'Number of brokers is wrong provided');
  });

  it('Should create new processes as number of brokers and 1 Scaler', () => {
    let numberOfBrokerProcesses = 0;
    let numberOfScalerProcesses = 0;

    depReplace.cluster.fork = () => ({
      on: () => { },
      send: (obj) => {
        if (obj.processName === 'Broker') {
          expect(obj.processId).to.be.at.least(0, 'Broker id is less then 0');
          numberOfBrokerProcesses++;
        }

        if (obj.processName === 'Scaler') {
          expect(obj.processId).deep.equal(-1, 'Scaler id is not -1');
          numberOfScalerProcesses++
        }
      }
    });

    const processes = proxyquire.noCallThru()(rootFile, depReplace);
    processes.masterProcess({ brokers: 5, horizontalScaleOptions: { masterOptions: true } });
    expect(numberOfScalerProcesses).deep.equal(1, 'No Scaler provided');
    // need to add broker creation
    // expect(numberOfBrokerProcesses).deep.equal(5,'Number of brokers is wrong provided');
  });

})