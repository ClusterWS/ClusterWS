const { ClusterWS, Mode, Middleware } = require('../../dist/index');

new ClusterWS({
  mode: Mode.SingleProcess,
  port: 3001,
  worker: Worker,
});

function Worker() {
  let wss = this.wss;
  // console.log(Buffer.from(JSON.stringify(['e', 'hello', 'world'])).toJSON())

  wss.addMiddleware(Middleware.verifyConnection, (info, next) => {
    next(true);
  });

  // wss.addMiddleware(Middleware.onSubscribe, () => {
  //   console.log('Some cool thing 2');
  // })

  wss.on('connection', (socket) => {
    socket.on('hello', (msg) => {
      socket.sendRaw(msg);
    })
  });
}