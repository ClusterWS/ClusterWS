// import 'mocha';
// import { expect } from 'chai';

// import { encode, decode } from '../src/modules/socket/parser';

// describe('Parser Encode Tests', () => {
//   it('Should return right emit message', (done) => {
//     const message = encode('My event', { data: 'My data' }, 'emit');
//     expect(message).to.equal(JSON.stringify({ '#': ['e', 'My event', { data: 'My data' }] }));
//     done(null);
//   });

//   it('Should return right publish message', (done) => {
//     const message = encode('My event', { data: 'My data' }, 'publish');
//     expect(message).to.equal(JSON.stringify({ '#': ['p', 'My event', { data: 'My data' }] }));
//     done(null);
//   });

//   it('Should return right system message', (done) => {
//     const message = encode('configuration', { data: 'My data' }, 'system');
//     expect(message).to.equal(JSON.stringify({ '#': ['s', 'c', { data: 'My data' }] }));
//     done(null);
//   });
// });
