const { WebSocket } = require('@clusterws/cws');

const websocketUrl = `ws://localhost:3001`;
let msg = JSON.stringify(['e', 'hello', 'world']);

let incoming = 0;

let socket = new WebSocket(websocketUrl);

socket.on('open', () => {
  console.log("Connected");
  socket.send(msg);
})

socket.on('message', (message) => {
  incoming++;
  // console.log(message);
  socket.send(msg)
});

setInterval(() => {
  console.log(incoming);
  incoming = 0;
}, 10000);

// }, Math.floor(Math.random() * 1000) + 100);
// }

// setInterval(() => {
//   console.log('Incoming messages', incoming);
//   console.log('Opened', opened);
//   console.log('Closed', closed);

//   incoming = 0;
// }, 1000);