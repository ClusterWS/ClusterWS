const { WebSocket } = require('@clusterws/cws');
const websocketUrl = `ws://localhost:3002`;

let socket = new WebSocket(websocketUrl);

socket.on('open', () => {
    socket.send(JSON.stringify(['s', 's', 'hello']));
    setInterval(() => {
        let message = {
            hello: "world",
            timestamp: new Date().getTime()
        };
        socket.send(JSON.stringify(['p', 'hello', message]));
    }, 5000);
});