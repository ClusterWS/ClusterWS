const { WebSocket } = require('@clusterws/cws');

// const websocketUrl = `ws://localhost:3001`;
// let msg = JSON.stringify(['s', 's', ['world']]);
// let pb = JSON.stringify(['p', 'world', 'hi']);

// let incoming = 0;

// let socket = new WebSocket(websocketUrl);

// socket.on('open', () => {
//   // console.log("Connected");
//   socket.send(msg);
// })

// socket.on('message', (message) => {
//   // incoming++;
//   // console.log(message);
//   console.log(message)
//   setTimeout(() => {
//     socket.send(pb);

//   }, 5000)
// });

global.window = {
  WebSocket: WebSocket
}
// window.WebSocket = WebSocket;
const ClusterWS = require("./ClusterWSClient.js");

let socket = new ClusterWS({
  url: `ws://127.0.0.1:3000/ws/`
})

socket.on('open', () => {
  console.log("Socket connected");
});

socket.on('message', (message) => {
  console.log(message);
})

socket.on('error', (error) => {
  console.log(error);
})

socket.on('ping', () => {
  console.log('Got ping');
})
// setInterval(() => {
//   console.log(incoming);
//   incoming = 0;
// }, 10000);

// }, Math.floor(Math.random() * 1000) + 100);
// }

// setInterval(() => {
//   console.log('Incoming messages', incoming);
//   console.log('Opened', opened);
//   console.log('Closed', closed);

//   incoming = 0;
// }, 1000);