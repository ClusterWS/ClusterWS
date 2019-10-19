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
    engine: WSEngine.CWS, // before using WSEngine.WS install 'ws' module
    autoPing: true,
    pingInterval: 20000
  },
  tlsOptions: { /** default node.js tls options */ }
});

async function worker(server) {
  // TODO: add some middleware

  server.ws.on('connection', (ws) => {
    ws.on('message', (message) => {
      // example of publishing message to some channel
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.publish) {
        server.wss.publish(parsedMessage.channel, parsedMessage.message, ws.id);
      }
    });

    ws.on('error', (err) => {
      // on error
    });

    ws.on('close', (code, reason) => {
      // on close
    });

    ws.on('pong', () => {
      // on pong received
    })
  });

  server.on('error', (err) => {
    console.log('Error while creating server', err);
    server.close();
  });
  // add express or any other app
  server.on('request', app);

  // close server an wss (webSocketServer)
  // server.close();
  server.start();
}

