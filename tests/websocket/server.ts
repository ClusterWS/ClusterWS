/* tslint:disable */
import { expect } from 'chai';
import { WebSocket } from '@clusterws/cws';

import ClusterWS from '../../src/index';

// const ClusterWS = require('../../dist/index');

// This test only in CurrentProcess mode
const port = 3000;
const websocketUrl = `ws://localhost:${port}`;

const options = {
  mode: 1,
  port: port,
  logger: {
    info: () => { },
    warning: () => { },
    error: () => { },
    debug: () => { }
  }
}

describe('WebSocket Server Creation', () => {
  it("Should create server and call Worker function with correct 'this' argument", (done) => {
    new ClusterWS({
      ...options,
      worker: function () {
        expect(this).to.contain.keys('wss', 'server');
        this.server.close();
        done();
      }
    })
  });
});



// Default events test
describe('WebSocket Server Default Events', () => {
  it("Should create receive on 'connection' event when new websocket is connected with correct keys", (done) => {
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          this.server.close();
          done();
        })
      }
    });

    // create websocket client
    new WebSocket(websocketUrl);
  });


  it("Should call on 'disconnect' if client disconnect from the server ", (done) => {
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('disconnect', () => {
            this.server.close();
            done();
          })
        })
      }
    });

    // create websocket client
    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.close();
    })
  });

  it("Should receive event on 'error' not correct type of message passed and no on 'message' listener", (done) => {
    let message = "My super secret message";
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('error', (data) => {
            done();
            this.server.close();
          });
        });
      }
    });

    // create websocket client
    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.send(message);
    })
  });

  it("Should receive events only to 'message' if user decide to listen on message event", (done) => {
    let message = "My super secret message";
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('message', (data) => {
            expect(data).to.be.eql(message);
            done();
            this.server.close();
          });
        });
      }
    });

    // create websocket client
    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.send(message);
    })
  });
});


// TODO: add full tests for each possible event (publish, subscribe, unsubscribe, emit)
// Parse received protocol message correctly and response
describe('WebSocket Server Should parse ClusterWS protocol correctly', () => {
  it("Should receive event 'emit' with message and out to correct message to listener", (done) => {
    let message = ['e', 'hello', 'world'];
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('hello', (incomingMessage) => {
            expect(incomingMessage).to.eql(message[2]);
            done();
            this.server.close();
          })
        })
      }
    });

    // create websocket client
    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.send(JSON.stringify(message))
    });
  });
})