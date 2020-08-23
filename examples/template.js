
const { ClusterWS } = require('../dist');

new ClusterWS({
  port: 3000,
  spawn: spawn,
  logger: {
    logLevel: 'debug'
  },
  scaleOptions: {
    off: true,
    workers: {
      instances: 10
    },
    brokers: {
      instances: 3,
      entries: [{ port: 3001 }, { port: 3002 }, { port: 3003 }],
      // externalEntries: [{ port: 3001, host: "xyz" }]
    }
  },
  websocketOptions: {
    path: '/',
    engine: "@clusterws/cws", // make sure to install correct module
    // autoPing: true,
    // pingInterval: 20000,
    // appLevelPing: true // mostly used for browser will send ping in app level requires manual set up
  },
  // tlsOptions: { /** default node.js tls options */ }
})

async function spawn({ worker, wss, server, logger }) {
  // server -> http or https server
  // worker -> main worker instance allow to communicate with other workers
  // wss -> websocket server
  // logger -> logger you passed in options or default pino logger

  // send specific message to specific worker id
  // worker.sendToWorkers("specific workerId", "My Message");

  // broadcast to all workers 
  // worker.broadcastToWorkers("My Message");

  wss.verifyConnectionOnUpgrade((req, socket, upgradeHead, next) => {
    // verify and allow user to pass
    logger.info('My info is here');
    req.someTest = "Some of my stuff in here"

    // pass connection
    next();

    // fail connection
    // next(false);
  });

  wss.on('connection', (ws, req) => {
    logger.info('New websocket connection', req.someTest);

    ws.on('message', (message) => {
      logger.info('Got message', message);
      // handle on message

      // example of sending message
      ws.send("Send some message")
    });

    ws.on('error', (err) => {
      // handle on error
    });

    ws.on('pong', () => {
      // handle on pong received
    });

    ws.on('close', (code, reason) => {
      // handle on ws connection close
    });
  })

  worker.on('messageFromWorker', (workerId, message) => {
    // other worker sent message
    // you can use this communicate between different clients on
    // different workers
  })

  worker.on('error', (err) => {
    // this includes websocket server and http(s) server errors
    logger.error(`[${process.pid}] Worker received error: ${err}`);
  });

  worker.start(() => {
    logger.info(`[${process.pid}] Worker is running`);
  });
}