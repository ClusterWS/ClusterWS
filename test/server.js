var clusterWS = require('../dist/index').ClusterWS;

var cws = new clusterWS({
    pathToWorker: __dirname + '/worker.js',
    workers: 2,
    port: 3000,
    restartWorkerOnFail: false,
    brokerPort: 9346,
    pingPongInterval: 5000
});
