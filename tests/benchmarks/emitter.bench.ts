import { EventEmitterMany } from '../../src/modules/emitter/many';

// Old Version
// let many = new EventEmitterMany1();

// console.time('Set listeners');
// let called = 0;
// for (let i = 1000000; i > 0; i--) many.onMany('test', () => called++);
// console.log(called);
// console.timeEnd('Set listeners');

// console.time('Call listeners');
// many.emitMany('test', 'Hello world');
// console.log(called);
// console.timeEnd('Call listeners');

// New Version

let many = new EventEmitterMany();

console.time('Set listeners');
let called = 0;
for (let i = 1000000; i > 0; i--) many.subscribe('test', () => called++, '' + i);
console.log(called);
console.timeEnd('Set listeners');

console.time('Call listeners');
many.publish('test', 'Hello world');
console.log(called);
console.timeEnd('Call listeners');
