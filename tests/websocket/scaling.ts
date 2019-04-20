// /* tslint:disable */
// import * as cluster from 'cluster';

// import { expect } from 'chai';
// import { WebSocket } from '@clusterws/cws';

// import { ClusterWS, Mode, Middleware } from '../../src/index';

// const options =
// if (cluster.isWorker) {
//   console.log('Got in here');
// } else {

//   describe('Testing', () => {
//     it('Should boot workers', (done) => {
//       new ClusterWS({
//         worker: function () {
//           console.log('Got in worker');
//         },
//         mode: Mode.Scale,
//         port: 4000,
//         websocketOptions: {
//           sendConfigurationMessage: false
//         },
//         loggerOptions: {
//           logger: {
//             info: () => { },
//             warning: () => { },
//             error: () => { },
//             debug: () => { }
//           }
//         }
//       });
//     });
//   });
// }



// // This test only in SingleProcess mode
// const port = 3000;
// const websocketUrl = `ws://localhost:${port}`;

// const options = {
//   mode: Mode.Scale,
//   port: port,
//   loggerOptions: {
//     logger: {
//       info: () => { },
//       warning: () => { },
//       error: () => { },
//       debug: () => { }
//     }
//   },
//   scaleOptions: {
//     workers: 2,
//   }
// }

