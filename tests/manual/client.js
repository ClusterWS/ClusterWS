const { WebSocket } = require('@clusterws/cws');

const websocketUrl = `ws://localhost:3001`;

let incoming = 0;
let closed = 0;
let opened = 0;
// for (let i = 0; i < 500; i++) {
setTimeout(() => {
  let socket = new WebSocket(websocketUrl);

  socket.on('open', () => {
    opened++;
    // console.log("Connected");
    socket.send(JSON.stringify(['s', 's', 'hello']));

    // setInterval(() => {
    //   // socket.send(JSON.stringify(['e', 'hello', 'world']))
    //   // socket.send(JSON.stringify(['p', 'hello', 'world']));
    // }, 10000);
  })

  socket.on('message', (message) => {
    incoming += JSON.parse(message)[2]['hello'].length;
    console.log(message);
  });

  socket.on('close', () => {
    closed++;
    opened--;
  })
}, Math.floor(Math.random() * 1000) + 100);
// }

// setInterval(() => {
//   console.log('Incoming messages', incoming);
//   console.log('Opened', opened);
//   console.log('Closed', closed);

//   incoming = 0;
// }, 1000);