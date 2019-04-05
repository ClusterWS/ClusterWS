const { ClusterWS, Mode, Middleware, LogLevel, Scaler } = require('../../dist/index');

new ClusterWS({
  mode: Mode.Scale,
  port: 3001,
  worker: Worker,
  websocketOptions: {
    wsPath: "/"
  },
  loggerOptions: {
    logLevel: LogLevel.DEBUG
  },
  scaleOptions: {
    scaler: Scaler.Default,
    workers: 2,
    redis: {},
    default: {
      brokers: 3
    }
  }
});

function Worker() {
  let wss = this.wss;
  // console.log(Buffer.from(JSON.stringify(['e', 'hello', 'world'])).toJSON())

  // wss.addMiddleware(Middleware.verifyConnection, (info, next) => {
  //   next(true);
  // });

  // wss.addMiddleware(Middleware.onSubscribe, () => {
  //   console.log('Some cool thing 2');
  // })

  wss.on('connection', (socket) => {
    socket.on('hello', (msg) => {
      socket.sendRaw(msg);
    })
  });
}