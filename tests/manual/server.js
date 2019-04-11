const { ClusterWS, Mode, Middleware, LogLevel, Scaler } = require('../../dist/index');

new ClusterWS({
  mode: Mode.Single,
  port: 3001,
  worker: Worker,
  websocketOptions: {
    wsPath: "/",
    autoPing: false
  },
  loggerOptions: {
    logLevel: LogLevel.DEBUG
  },
  scaleOptions: {
    scaler: Scaler.Default,
    workers: 2,
    redis: {
      host: 'localhost',
      port: 6379
    },
    default: {
      brokers: 1
    }
  }
});

async function Worker() {
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
      // socket.sendRaw(msg);
      console.log('Received hello', process.pid);
      wss.publish('hello', 'my super message which should be published to another channel');
    })
  });
}