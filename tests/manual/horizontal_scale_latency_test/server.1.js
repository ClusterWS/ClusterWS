const { ClusterWS, Mode, Middleware, LogLevel, Scaler } = require('../../../dist/index');

new ClusterWS({
  mode: Mode.Scale,
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
      brokers: 1,
      horizontalScaleOptions: {
        masterOptions: {
          port: 3005
        }
      }
    }
  }
});

async function Worker() {
  let wss = this.wss;
  wss.on('connection', (socket) => {
    socket.on('hello', (msg) => {
      console.log('Received hello', process.pid);
      wss.publish('hello', 'my super message which should be published to another channel');
    })
  });
}