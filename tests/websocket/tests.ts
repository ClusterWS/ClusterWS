/* tslint:disable */
import { expect } from 'chai';
import { WebSocket } from '@clusterws/cws';


import { Socket } from '../../src/modules/socket/socket';
import { Worker } from '../../src/modules/worker';

import { ClusterWS, Mode, Middleware } from '../../src/index';

// TODO: split this tests in different files

//  Supporting function
function createClusterWSServer(additionalOptions) {
  new ClusterWS({
    mode: Mode.Single,
    port: 4000,
    // engine: 'ws',
    websocketOptions: {
      sendConfigurationMessage: false
    },
    loggerOptions: {
      logger: {
        info: () => { },
        warning: () => { },
        error: () => { },
        debug: () => { }
      }
    },
    ...additionalOptions
  });
}

function createWebsocketClient(additionalOptions) {
  const options = {
    url: 'ws://127.0.0.1:4000',
    open: () => { },
    close: () => { },
    error: () => { },
    message: () => { },
    ...additionalOptions
  }

  const socket = new WebSocket(options.url);
  socket.on('open', options.open.bind(socket));
  socket.on('error', options.error.bind(socket));
  socket.on('close', options.close.bind(socket));
  socket.on('message', options.message.bind(socket));
}

// Actual tests
describe('Validation && Calling correct default actions', () => {
  it('Should call worker function on creation with correct "this" argument', (done) => {
    const serverOptions = {
      worker: function () {
        expect(this).to.be.instanceOf(Worker);
        // we need to close server manually
        this.server.close();
        done();
      }
    }

    createClusterWSServer(serverOptions);
  });

  // TODO: add more option validation tests
  it('Should fail creation if worker is not function', (done) => {
    const serverOptions = {
      worker: "",
      loggerOptions: {
        logger: {
          error: (error) => {
            expect(error).to.be.eql('Worker is not provided or is not a function');
            done();
          },
          info: () => { },
          warning: () => { },
          debug: () => { }
        }
      }
    }
    createClusterWSServer(serverOptions);
  });

  it('Should send configuration message if option is enable', (done) => {
    let server;
    const configurationMessage = ["s", "c", { "autoPing": true, "ping": 20000 }];
    const serverOptions = {
      worker: function () {
        server = this.server;
      },
      websocketOptions: {}
    }

    const clientOptions = {
      message: function (message) {
        expect(message).to.be.eql(JSON.stringify(configurationMessage));
        server.close();
        done();
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });
});

describe('WebSockets default events', () => {
  it('Should receive "connection" event on new connection and pass correct socket instance', (done) => {
    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          expect(socket).to.be.instanceOf(Socket);
          // we need to close server manually
          this.server.close();
          done();
        });
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient({});
  });

  it('Should receive "close" event on connection close with correct code and reason', (done) => {
    const closeCode = 4001;
    const closeReason = 'Closed for some reason';

    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on("close", (code, reason) => {
            expect(code).to.be.eql(closeCode);
            expect(reason).to.be.eql(closeReason);
            this.server.close();
            done();
          });
        });
      }
    };

    const clientOptions = {
      open: function () {
        this.close(closeCode, closeReason);
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Should receive on "error" if something went wrong (protocol error)', (done) => {
    // TODO: this 
    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('error', (error) => {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.be.eql("Received message is not correct structure");
            this.server.close();
            done();
          });
        });
      }
    };

    const clientOptions = {
      open: function () {
        // this will send incorrect protocol message
        this.send(JSON.stringify(1));
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });
});



describe('WebSockets Messaging', () => {
  it('Should receive "hello" event sent from the client with correct message and send it back', (done) => {
    const sentMessage = ['e', 'hello', 'world'];
    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('hello', (message) => {
            expect(message).to.be.eql(sentMessage[2]);
            socket.send('hello', message);
            this.server.close();
          });
        });
      }
    };

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(sentMessage));
      },
      message: function (message) {
        expect(message).to.be.eql(JSON.stringify(sentMessage));
        done();
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });
});




describe('Pub Sub Communication', () => {
  it('Should subscribe socket to the channel on subscribe event received and unsubscribe if socket is closed', (done) => {
    const subscribeEvent = ['s', 's', ['hello world']];
    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          setTimeout(() => {
            expect((socket as any).channels).to.contain.keys('hello world');
            expect((socket as any).worker.wss.pubSub.channels['hello world']).have.members(['#broker', (socket as any).id]);
            socket.close();
          }, 10);
          socket.on('close', () => {
            setTimeout(() => {
              expect((socket as any).channels).to.not.contain.keys('hello world');
              expect((socket as any).worker.wss.pubSub.channels['hello world']).to.be.undefined;
              this.server.close();
              done();
            }, 10)
          });
        });
      }
    };

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Server should unsubscribe socket from the channel if unsubscribe event received', (done) => {
    const subscribeEvent = ['s', 's', ['hello world']];
    const unsubscribeEvent = ['s', 'u', 'hello world'];

    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          setTimeout(() => {
            expect((socket as any).channels).to.not.contain.keys('hello world');
            expect((socket as any).worker.wss.pubSub.channels['hello world']).to.be.undefined;
            this.server.close();
            done();
          }, 10);
        });
      }
    };

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
        setTimeout(() => {
          this.send(JSON.stringify(unsubscribeEvent));
        }, 5);
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });


  it('Should publish message to everyone who listens to the message', (done) => {
    let server;
    const subscribeEvent = ['s', 's', ['hello']];
    const publishMessage = ['p', 'hello', 'world'];
    const expectedBackReceivedMessage = ["p", null, { "hello": ["world"] }];

    const acceptSubscribeMessage = ['s', 's', { hello: true }];

    const serverOptions = {
      worker: function () {
        server = this.server;
        this.wss.on('connection', (socket) => { });
      }
    };

    const client1 = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
        setTimeout(() => {
          this.send(JSON.stringify(publishMessage));
        }, 20);
      },
      message: function (message) {
        if (message !== JSON.stringify(acceptSubscribeMessage)) {
          done('Client 1 should not receive message');
        }
      }
    }

    const client2 = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
      },
      message: function (message) {
        if (message !== JSON.stringify(acceptSubscribeMessage)) {
          expect(message).to.be.eql(JSON.stringify(expectedBackReceivedMessage));
          server.close();
          done();
        }
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(client2);
    createWebsocketClient(client1);
  });
});



describe('Raw Websocket methods', () => {
  it('If on "message" specified, it should intercept all incoming messages', (done) => {
    const sentMessage = "my custom message";
    const backReceivedMessage = ["e", "hello", "my custom message"];

    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('message', (message) => {
            expect(message).to.be.eql(sentMessage);
            socket.send('hello', message);
            this.server.close();
          });
        });
      }
    };

    const clientOptions = {
      open: function () {
        this.send(sentMessage);
      },
      message: function (message) {
        expect(message).to.be.eql(JSON.stringify(backReceivedMessage));
        done();
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('If used "send" without event parameter it should send message without protocol encoding', (done) => {
    const sentMessage = "my custom message";

    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('message', (message) => {
            expect(message).to.be.eql(sentMessage);
            socket.send(message);
            this.server.close();
          });
        });
      }
    };

    const clientOptions = {
      open: function () {
        this.send(sentMessage);
      },
      message: function (message) {
        expect(message).to.be.eql(sentMessage);
        done();
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Should process with parsing message if on "message" received and message is passed in "processMessage()" ', (done) => {
    const sentMessage = ['e', 'hello', 'world'];
    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('message', (message) => {
            expect(message).to.be.eql(JSON.stringify(sentMessage));
            // it also allows to pass parsed message
            socket.processMessage(JSON.parse(message));
          });

          socket.on('hello', (message) => {
            expect(message).to.be.eql(sentMessage[2]);
            socket.send('hello', message);
            this.server.close();
          });
        });
      }
    };

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(sentMessage));
      },
      message: function (message) {
        expect(message).to.be.eql(JSON.stringify(sentMessage));
        done();
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });
});


describe("ClusterWS Middleware", () => {
  it('Should not allow to connect to the websocket server if "verifyConnection" decline connection', (done) => {
    let server;
    const serverOptions = {
      worker: function () {
        server = this.server;
        this.wss.addMiddleware(Middleware.verifyConnection, (info, next) => {
          // TODO: probably need to change this logic to call just next to process message
          next(false);
        });

        this.wss.on('connection', () => {
          done('On "connection" event should not be called')
        });
      }
    }

    const clientOptions = {
      open: function () {
        done('On "open" event should not be called');
      },
      error: function (err) {
        server.close();
        done();
      }
    }
    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Should allow to connect to the websocket server if "verifyConnection" accepts connection', (done) => {
    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.verifyConnection, (info, next) => {
          // TODO: probably need to change this logic to call just next to process message
          next(true);
        });

        this.wss.on('connection', () => {
          this.server.close();
          done()
        });
      }
    }

    const clientOptions = {
      error: function (err) {
        done('Error should not be called');
      }
    }
    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Should not subscribe to the channel if "onSubscribe" middleware declined subscription', (done) => {
    const subscribeEvent = ['s', 's', ['hello world']];
    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onSubscribe, (socket, channel, next) => {
          expect(channel).to.be.eql(subscribeEvent[2][0]);

          next(false);
          setTimeout(() => {
            // check if channel exists
            expect((socket as any).channels).to.not.contain.keys('hello world');
            expect((socket as any).worker.wss.pubSub.channels['hello world']).to.be.undefined;
            this.server.close();
            done();
          }, 10);
        });

        this.wss.on('connection', () => { });
      }
    }

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Should subscribe to the channel if "onSubscribe" middleware accepts subscription', (done) => {
    const subscribeEvent = ['s', 's', ['hello world']];
    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onSubscribe, (socket, channel, next) => {
          expect(channel).to.be.eql(subscribeEvent[2][0]);
          next(true);
          setTimeout(() => {
            // check if channel exists
            expect((socket as any).channels).to.contain.keys('hello world');
            expect((socket as any).worker.wss.pubSub.channels['hello world']).have.members(['#broker', (socket as any).id]);
            this.server.close();
            done();
          }, 10);
        });

        this.wss.on('connection', () => { });
      }
    }

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Should call unsubscribe middleware if "onUnsubscribe" provided', (done) => {
    const subscribeEvent = ['s', 's', ['hello world']];
    const unsubscribeEvent = ['s', 'u', 'hello world'];

    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onUnsubscribe, (socket, channel) => {
          expect(channel).to.be.eql(subscribeEvent[2][0]);
          this.server.close();
          done();
        });

        this.wss.on('connection', () => { });
      }
    }

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
        setTimeout(() => {
          this.send(JSON.stringify(unsubscribeEvent));
        }, 10);
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Middleware "onChannelOpen"  should be called if exists', (done) => {
    const subscribeEvent = ['s', 's', ['hello world']];
    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onChannelOpen, (channel) => {
          expect(channel).to.be.eql(subscribeEvent[2][0]);
          this.server.close();
          done();
        });
      }
    }

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });

  it('Middleware "onChannelClose" should be called if exists', (done) => {
    const subscribeEvent = ['s', 's', ['hello world']];
    const unsubscribeEvent = ['s', 'u', 'hello world'];

    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onChannelClose, (channel) => {
          expect(channel).to.be.eql(subscribeEvent[2][0]);
          this.server.close();
          done();
        });
      }
    }

    const clientOptions = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
        setTimeout(() => {
          this.send(JSON.stringify(unsubscribeEvent));
        }, 10);
      }
    }

    createClusterWSServer(serverOptions);
    createWebsocketClient(clientOptions);
  });
});