import { Worker } from './server';
import { WSEngine } from '../engine';

// Simple server wrapper example
new Worker({
  worker,
  port: 3000,
  engine: WSEngine.CWS
});

function worker(): void {
  const wss: any = this.wss;
  const server: any = this.server;

  setInterval(() => {
    wss.pubSub.publish('my channel', 'my super message');
  }, 10000);

  wss.on('connection', (ws: any) => {
    wss.pubSub.register(ws, (msg: any) => {
      // handle socket registration
      console.log('Got publish', msg);
    });

    ws.subscribe('my channel');

    console.log('Got connection ');
    ws.on('close', () => {
      console.log('connection closed');
    });
  });

  // server.on('request')

  // start server
  // should we start is differently
  this.start(() => {
    console.log('Server has been started');
  });

  // this will close server
  // this.close();
}