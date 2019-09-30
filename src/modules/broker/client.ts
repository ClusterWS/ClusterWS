// Test template
import { connect } from 'net';

const path: string = './socket.unix';

let socket: any = connect({ path });

socket.on('connect', () => {
  console.log('here');
  socket.write('hello world');
});

socket.on('error', () => {
  console.log('Got error');
});