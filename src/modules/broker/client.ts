// Test template
import { connect } from 'net';
import { Networking } from './networking';

const path: string = './socket.unix';

let socket: any = connect({ path });
socket.setNoDelay(true);
socket.networking = new Networking(socket);

socket.networking.onMessage((message: string) => {
  console.log('Round trip', new Date().getTime() - parseInt(message, 10) + 'ms');
});

socket.on('connect', () => {
  setInterval(() => {
    socket.networking.send(new Date().getTime() + '');
  }, 1000);
});

socket.on('error', () => {
  console.log('Got error');
});