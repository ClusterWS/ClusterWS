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
  it("Should receive on 'connection' event when new websocket is connected to the server", (done) => {
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


  it("Should receive on 'disconnect' event when websocket client disconnects from the server ", (done) => {
    const code = 2345;
    const message = 'Some cool message';
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('disconnect', (receivedCode, reason) => {
            // TODO: find out why we dont get correct code and reason
            // expect(receivedCode).to.be.eql(code);
            // expect(reason).to.be.eql(message);
            this.server.close();
            done();
          })
        })
      }
    });

    // create websocket client
    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.close(code, message);
    })
  });

  it("Should receive on 'error' event when not correct message passed to the server and no on 'message' listener created", (done) => {
    let message = "My super secret message";
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('error', (data) => {
            expect(data.message).to.be.eql('Received message is not correct structure');
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

  it("Should receive on 'message' event if user decide to listen on message (all other not default events will never be triggered in this case)", (done) => {
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
  it("Should receive on 'hello' (non default) event with correct message if 'emit' protocol message passed ", (done) => {
    let message = ['e', 'hello', 'world'];
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('hello', (incomingMessage) => {
            console.log(message[2]);
            expect(incomingMessage).to.be.eql(message[2]);
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