const { WebSocket } = require('@clusterws/cws');
const websocketUrl = `ws://localhost:3001`;

let socket = new WebSocket(websocketUrl);

socket.on('open', () => {
    socket.send(JSON.stringify(['s', 's', 'hello']));
});

socket.on('message', (message) => {
    let msg = JSON.parse(message);
    let time = new Date().getTime() - msg[2].hello[0].timestamp;
    console.log('Received message in: ', time);
})