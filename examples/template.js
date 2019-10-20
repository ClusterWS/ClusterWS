// ClusterWS Template
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
  // Client must implement pub sub wrapper to read
  // pub sub messages which looks like
  // ['p', {channelName: [msg1,msg2,mgg3], channelName2: [msg1,msg2]...}]

  server.ws.on('connection', (ws) => {
    ws.on('message', (message) => {
      // simple pub sub protocol example
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.publish) {
        if (parsedMessage.includingSender) {
          // publish to everyone in that channel including sender
          server.ws.publish(parsedMessage.channel, parsedMessage.message)
        } else {
          // publish to everyone except sender
          ws.publish(parsedMessage.channel, parsedMessage.message);
        }
      }

      if (parsedMessage.subscribe) {
        // subscribe to specific channel
        ws.subscribe(parsedMessage.channel);
      }

      if (parsedMessage.unsubscribe) {
        // unsubscribe from specific channel
        ws.unsubscribe(parsedMessage.channel);
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
    });
  });

  server.on('error', (err) => {
    console.log('Error while creating server', err);
    server.close();
  });
  // add express or any other app
  server.on('request', app);

  // close http and ws server
  // server.close();
  server.start();
}

