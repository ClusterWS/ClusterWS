// Test template
import { connect } from 'net';
import { Networking } from './networking';

const path: string = './socket.unix';

const socket: any = connect({ path });
socket.setNoDelay(true);
socket.networking = new Networking(socket);

socket.networking.onMessage((message: string) => {
  console.log(message);
  // console.log('Round trip', new Date().getTime() - parseInt(message, 10) + 'ms');
});

socket.on('connect', () => {

  socket.networking.send('shello world');

  setInterval(() => {
    socket.networking.send(JSON.stringify({
      'hello world': ['hello from ' + process.pid]
    }));
  }, 1000);

  setTimeout(() => {
    socket.networking.send('uhello world');
  }, 10000);
  // setInterval(() => {
  //   socket.networking.send(new Date().getTime() + '');
  // }, 1000);
});

socket.on('error', () => {
  console.log('Got error');
});