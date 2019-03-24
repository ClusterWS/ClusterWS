/* tslint:disable */
import { expect } from 'chai';
import { WebSocket } from '@clusterws/cws';

import { ClusterWS, Mode, Middleware } from '../../src/index';

// This test only in SingleProcess mode
const port = 3000;
const websocketUrl = `ws://localhost:${port}`;

const options = {
  mode: Mode.SingleProcess,
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


// Default events and functions test
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
    const code = 3000;
    const message = 'My super reason';
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('disconnect', (receivedCode, reason) => {
            expect(receivedCode).to.be.eql(code);
            expect(reason).to.be.eql(message);
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



  it("Should close socket if `disconnect()` function is called", (done) => {
    const code = 3000;
    const message = 'My super reason';
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.disconnect(code, message);
          this.server.close();
        })
      }
    });

    // create websocket client
    let socket = new WebSocket(websocketUrl);
    socket.on('close', (receivedCode, reason) => {
      expect(receivedCode).to.be.eql(code);
      expect(reason).to.be.eql(message);
      done();
    });
  });
});

// Parse received protocol message correctly and response
describe('WebSocket Server Should parse (received message) ClusterWS protocol correctly', () => {
  it("Should receive on 'hello' (non default) event with correct message if 'emit' protocol message received ", (done) => {
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

  it("Should subscribe to correct channel if 'system subscribe' protocol message received ", (done) => {
    let message = ['s', 's', 'hello world'];
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          // we need timeout while we receive subscribe event
          setTimeout(() => {
            expect(socket.channels).to.contain.keys('hello world');
            expect(socket.worker.wss.pubSub.channels['hello world']).have.members(['broker', socket.id]);
            done();
            this.server.close();
          }, 10);
        })
      }
    });

    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.send(JSON.stringify(message))
    });
  });

  it("Should unsubscribe from correct channel if 'system unsubscribe' protocol message received ", (done) => {
    let message = ['s', 's', 'hello world'];
    let unsubscribeMessage = ['s', 'u', 'hello world'];

    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          // we need timeout while we receive subscribe event
          setTimeout(() => {
            expect(socket.channels).to.contain.keys('hello world');
            expect(socket.worker.wss.pubSub.channels['hello world']).have.members(['broker', socket.id]);
            setTimeout(() => {
              expect(socket.channels).to.not.contain.keys('hello world');
              expect(socket.worker.wss.pubSub.channels['hello world']).to.be.undefined;
              done();
              this.server.close();
            }, 10)
          }, 10);
        })
      }
    });

    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.send(JSON.stringify(message))
      setTimeout(() => {
        socket.send(JSON.stringify(unsubscribeMessage));
      }, 15);
    });
  });


  it("Should publish message to correct channel if 'system publish' protocol message received ", (done) => {
    const message = ['p', 'hello world channel', 'my super message'];
    const subscribeMessage = ['s', 's', 'hello world channel'];

    let server;
    new ClusterWS({
      ...options,
      worker: function () {
        server = this.server;
        this.wss.on('connection', (socket) => {

        });
      }
    });


    let socket1 = new WebSocket(websocketUrl);
    socket1.on('open', () => {
      socket1.send(JSON.stringify(subscribeMessage));
      let socket2 = new WebSocket(websocketUrl);
      socket2.on('open', () => {
        socket2.send(JSON.stringify(subscribeMessage));
        socket1.send(JSON.stringify(message));
      })

      socket2.on('message', (message) => {
        setTimeout(() => {
          expect(message).to.be.eql('["p",null,{"hello world channel":["my super message"]}]');
          server.close()
          done();
        }, 20);
      });
    });

    socket1.on('message', () => {
      done('Socket1 should not receive message');
    });
  });
});


// Test to create correct message based on protocol  and send and receive (or raw message send)
describe('WebSocket Server Should send end receive correct messages', () => {
  it("Should receive correct message and send beck correctly structured message", (done) => {
    let message = ['e', 'hello', 'world'];

    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          // we need timeout while we receive subscribe event
          socket.on('hello', (incoming) => {
            console.log("got here", incoming);
            expect(incoming).to.be.eql(message[2]);
            socket.send('hello', incoming);
            this.server.close();
          })
        })
      }
    });

    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.send(JSON.stringify(message))
    });

    socket.on('message', (incoming) => {
      expect(incoming).to.be.eql(JSON.stringify(message));
      done();
    });
  });

  it("Should receive and send raw messages if needed with `sendRaw()` and on `message` (with out using CLusterWS protocol)", (done) => {
    let message = 'hello';
    let messageBack = 'world';

    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.on('connection', (socket) => {
          // we need timeout while we receive subscribe event
          socket.on('message', (incoming) => {
            expect(incoming).to.be.eql(message);
            socket.sendRaw(messageBack);
            this.server.close();
          })
        })
      }
    });

    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      socket.send(message)
    });

    socket.on('message', (incoming) => {
      expect(incoming).to.be.eql(messageBack);
      done();
    });
  });
})



// TODO: Add middleware tests

describe('WebSocket Server Middleware', () => {
  it("Should intercept user connection if `Middleware.verifyConnection` is enabled", (done) => {
    new ClusterWS({
      ...options,
      worker: function () {
        this.wss.addMiddleware(Middleware.verifyConnection, (info, next) => {
          setInterval(() => {
            this.server.close();
            done();
          }, 20);
        });

        this.wss.on('connection', (socket) => {
          // we need timeout while we receive subscribe event
          done('Should not be called')
        });
      }
    });

    let socket = new WebSocket(websocketUrl);
    socket.on('open', () => {
      done('should not be called')
    });
  });
});
