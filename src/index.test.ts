/* tslint:disable */
import 'mocha';
import { expect } from 'chai';
import { stdout } from 'test-console';
import * as proxyquire from 'proxyquire';

describe('ClusterWS should have proper Options asigned', () => {
  it('Should generate custom ports if they are not provided', () => {
    const CluterWS = proxyquire.noCallThru()('./index', { 'cluster': {} }).default;
    const cws = new CluterWS({
      worker: () => { },
      brokers: 5
    });

    expect(cws.options.brokersPorts).deep.equal([9400, 9401, 9402, 9403, 9404]);
  });

  it('Should have user broker ports if they are provided', () => {
    const CluterWS = proxyquire.noCallThru()('./index', { 'cluster': {} }).default;
    const cws = new CluterWS({
      worker: () => { },
      brokers: 5,
      brokersPorts: [100, 106, 104, 105, 107]
    });

    expect(cws.options.brokersPorts).deep.equal([100, 106, 104, 105, 107]);
  });

  it('Should print error if no worker function provided', () => {
    const CluterWS = proxyquire.noCallThru()('./index', { 'cluster': {} }).default;
    const console_output = stdout.inspectSync(() => new CluterWS({}));

    expect(console_output[0]).deep.equal(`\u001b[31mError PID ${process.pid}:\u001b[0m  Here is error\n`)
  })
});