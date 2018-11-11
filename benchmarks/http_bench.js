
const os = require('os');
const ClusterWS = require('../../dist/index');

new ClusterWS({
  port: 3000,
  worker: Worker,
  // One instance
  // workers: 1,
  // Two instances
  // workers: 2,
  // Maximum number we need -2 because we have one broker and worker 
  // u can specify any number you want but for max perf better use it like that
  workers: os.cpus().length - 2
})

let html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>ClusterWS Test html</title>
    </head>
    <body>
      <h1>Hello world</h1>
    </body>
  </html>
`;

function Worker() {
  const server = this.server;

  server.on('request', (req, res) => {
    res.end(html);
  });
}