/* tslint:disable */
import 'mocha';
import { expect } from 'chai';
import { stdout } from 'test-console';
import * as proxyquire from 'proxyquire';

const rootFile = './process.ts';
const depReplace = {
  'cluster': {},
};


describe('processes.ts', () => {
  it('Should pass', () => { });
})