const ClusterWS = require('./dist/index');

new ClusterWS({
  worker: Worker,
  port: 80,
})

function Worker() {
  const wss = this.wss;
  const server = this.server;

  wss.on('connection', (socket) => {
    // console.log(socket);

    socket.worker.wss.subscribe('hello-world', socket.id, (channel, msg) => {
      console.log(channel, msg);
    });

    socket.on('disconnect', () => {
      console.log("socket closed");
    })
  });

  setInterval(() => {
    wss.publish('hello-world', 'Testing if it works');
  }, 5000);
}