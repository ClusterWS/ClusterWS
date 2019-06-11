const { ClusterWS, Mode, Middleware, LogLevel, Scaler } = require('../../dist/index');

new ClusterWS({
  mode: Mode.Scale,
  port: 3001,
  worker: Worker,
  websocketOptions: {
    // engine: "ws",
    wsPath: "/",
    autoPing: true
  },
  loggerOptions: {
    // logLevel: LogLevel.DEBUG
  },
  scaleOptions: {
    scaler: Scaler.Default,
    workers: 2,
    redis: {
      host: 'localhost',
      port: 6379
    },
    default: {
      brokers: 1,
      // horizontalScaleOptions: {
      //   masterOptions: {
      //     port: 3005
      //   }
      // }
    }
  }
});

async function Worker() {
  let wss = this.wss;
  // console.log(Buffer.from(JSON.stringify(['e', 'hello', 'world'])).toJSON())

  wss.addMiddleware(Middleware.onPublishIn, (channel, message, next) => {
    console.log(channel, message);
    next(channel, message + " world");
  });
  // wss.addMiddleware(Middleware.verifyConnection, ({ req }, next) => {
  //   // console.log('Got in here');
  //   // next(false);

  //   // next(true);
  // });
  // wss.addMiddleware(Middleware.onSubscribe, (socket, channel, allow) => {
  //   // if (channel === 'another') {
  //   return allow(false);
  //   // }
  // })

  // wss.addMiddleware(Middleware.onMessageFromWorker, (message) => {
  //   console.log('Got message from anther worker', process.pid, message);
  // })


  // setInterval(() => {
  //   this.wss.publishToWorkers('hello me');
  // }, 10000);


  wss.on('connection', (socket, req) => {
    // socket.on('message', (msg) => {
    //   socket.send(msg);
    // });

    socket.on('hello', (msg) => {
      socket.send(msg);
      // console.log('Received hello', process.pid);
      // wss.publish('hello', 'my super message which should be published to another channel');
    })

    socket.on('pong', () => {
      // console.log("Received pong");
    })
  });
}