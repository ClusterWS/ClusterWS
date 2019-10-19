// Template
// does not work yet!
const { ClusterWS, WSEngine } = require('@clusterws/server');

new ClusterWS({
  port: 3000,
  host: '127.0.0.1',
  worker: worker,
  // metrics: false // allow to stream metrics in specific function
  scaleOptions: {
    disabled: false, // disable scale logic
    brokers: {
      instances: 2,
      ports: [], // should not be required
    },
    workers: {
      instances: 6
    },
  },
  websocketOptions: {
    path: '/socket',
    engine: WSEngine.CWS,
    autoPing: true,
    pingInterval: 20000
  },
  tlsOptions: { /** default node js tls options */ }
});

async function worker(server) {
  server.wss.on('connection', (ws) => {
    ws.on('some channel', (message) => {
      // work with message;

      // publish to some topic 
      server.wss.publish('my super channel', 'hello world');
    });
  });

  // add express 
  server.onRequest(app);
}

