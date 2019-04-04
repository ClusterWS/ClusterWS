const { WebSocket } = require('@clusterws/cws');

const websocketUrl = `ws://localhost:3001`;

let socket = new WebSocket(websocketUrl);

socket.on('open', () => {
  console.log("Connected");
  socket.send(JSON.stringify(['s', 's', 'hello']));

  setInterval(() => {
    socket.send(JSON.stringify(['p', 'hello', 'world']));
  }, 1000);
})

socket.on('message', (message) => {
  console.log(message)
})