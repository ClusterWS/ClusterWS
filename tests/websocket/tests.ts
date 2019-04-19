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

  it('Should receive "disconnect" event on connection close with correct code and reason', (done) => {
    const closeCode = 4001;
    const closeReason = 'Closed for some reason';

    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on("disconnect", (code, reason) => {
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
    const subscribeEvent = ['s', 's', 'hello world'];
    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          setTimeout(() => {
            expect((socket as any).channels).to.contain.keys('hello world');
            expect((socket as any).worker.wss.pubSub.channels['hello world']).have.members(['broker', (socket as any).id]);
            socket.disconnect();
          }, 10);
          socket.on('disconnect', () => {
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
    const subscribeEvent = ['s', 's', 'hello world'];
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
    const subscribeEvent = ['s', 's', 'hello'];
    const publishMessage = ['p', 'hello', 'world'];
    const expectedBackReceivedMessage = ["p", null, { "hello": ["world"] }];

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
        done('Client 1 should not receive message');
      }
    }

    const client2 = {
      open: function () {
        this.send(JSON.stringify(subscribeEvent));
      },
      message: function (message) {
        expect(message).to.be.eql(JSON.stringify(expectedBackReceivedMessage));
        server.close();
        done();
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

  it('If used "sendRaw" it should send message without protocol encoding', (done) => {
    const sentMessage = "my custom message";

    const serverOptions = {
      worker: function () {
        this.wss.on('connection', (socket) => {
          socket.on('message', (message) => {
            expect(message).to.be.eql(sentMessage);
            socket.sendRaw(message);
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
    const subscribeEvent = ['s', 's', 'hello world'];
    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onSubscribe, (socket, channel, next) => {
          expect(channel).to.be.eql(subscribeEvent[2]);
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
    const subscribeEvent = ['s', 's', 'hello world'];
    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onSubscribe, (socket, channel, next) => {
          expect(channel).to.be.eql(subscribeEvent[2]);
          next(true);
          setTimeout(() => {
            // check if channel exists
            expect((socket as any).channels).to.contain.keys('hello world');
            expect((socket as any).worker.wss.pubSub.channels['hello world']).have.members(['broker', (socket as any).id]);
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
    const subscribeEvent = ['s', 's', 'hello world'];
    const unsubscribeEvent = ['s', 'u', 'hello world'];

    const serverOptions = {
      worker: function () {
        this.wss.addMiddleware(Middleware.onUnsubscribe, (socket, channel) => {
          expect(channel).to.be.eql(subscribeEvent[2]);
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

  // TODO: Add on channel close and on channel open tests
});












// // TODO: Rewrite tests to better alternative
// // This test only in SingleProcess mode
// const port = 3000;
// const websocketUrl = `ws://localhost:${port}`;

// const options = {
//   mode: Mode.Single,
//   port: port,
//   loggerOptions: {
//     logger: {
//       info: () => { },
//       warning: () => { },
//       error: () => { },
//       debug: () => { }
//     }
//   }
// }

// describe('WebSocket Server Creation', () => {
//   it("Should create server and call Worker function with correct 'this' argument", (done) => {
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         expect(this).to.contain.keys('wss', 'server');
//         this.server.close();
//         done();
//       }
//     })
//   });
// });


// // Default events and functions test
// describe('WebSocket Server Default Events', () => {
//   it("Should receive on 'connection' event when new websocket is connected to the server", (done) => {
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           this.server.close();
//           done();
//         })
//       }
//     });

//     // create websocket client
//     new WebSocket(websocketUrl);
//   });


//   it("Should receive on 'disconnect' event when websocket client disconnects from the server ", (done) => {
//     const code = 3000;
//     const message = 'My super reason';
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           socket.on('disconnect', (receivedCode, reason) => {
//             expect(receivedCode).to.be.eql(code);
//             expect(reason).to.be.eql(message);
//             this.server.close();
//             done();
//           })
//         })
//       }
//     });

//     // create websocket client
//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.close(code, message);
//     })
//   });

//   it("Should receive on 'error' event when not correct message passed to the server and no on 'message' listener created", (done) => {
//     let message = "My super secret message";
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           socket.on('error', (data) => {
//             expect(data.message).to.be.eql('Received message is not correct structure');
//             done();
//             this.server.close();
//           });
//         });
//       }
//     });

//     // create websocket client
//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(message);
//     })
//   });

//   it("Should receive on 'message' event if user decide to listen on message (all other not default events will never be triggered in this case)", (done) => {
//     let message = "My super secret message";
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           socket.on('message', (data) => {
//             expect(data).to.be.eql(message);
//             done();
//             this.server.close();
//           });
//         });
//       }
//     });

//     // create websocket client
//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(message);
//     })
//   });



//   it("Should close socket if `disconnect()` function is called", (done) => {
//     const code = 3000;
//     const message = 'My super reason';
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           socket.disconnect(code, message);
//           this.server.close();
//         })
//       }
//     });

//     // create websocket client
//     let socket = new WebSocket(websocketUrl);
//     socket.on('close', (receivedCode, reason) => {
//       expect(receivedCode).to.be.eql(code);
//       expect(reason).to.be.eql(message);
//       done();
//     });
//   });
// });

// // Parse received protocol message correctly and response
// describe('WebSocket Server Should parse (received message) ClusterWS protocol correctly', () => {
//   it("Should receive on 'hello' (non default) event with correct message if 'emit' protocol message received ", (done) => {
//     let message = ['e', 'hello', 'world'];
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           socket.on('hello', (incomingMessage) => {
//             expect(incomingMessage).to.be.eql(message[2]);
//             done();
//             this.server.close();
//           })
//         })
//       }
//     });

//     // create websocket client
//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(message))
//     });
//   });

//   it("Should subscribe to correct channel if 'system subscribe' protocol message received ", (done) => {
//     let message = ['s', 's', 'hello world'];
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           // we need timeout while we receive subscribe event
//           setTimeout(() => {
            // expect((socket as any).channels).to.contain.keys('hello world');
            // expect((socket as any).worker.wss.pubSub.channels['hello world']).have.members(['broker', (socket as any).id]);
//             done();
//             this.server.close();
//           }, 10);
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(message))
//     });
//   });

//   it("Should unsubscribe from correct channel if 'system unsubscribe' protocol message received ", (done) => {
//     let message = ['s', 's', 'hello world'];
//     let unsubscribeMessage = ['s', 'u', 'hello world'];

//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           // we need timeout while we receive subscribe event
//           setTimeout(() => {
//             expect((socket as any).channels).to.contain.keys('hello world');
//             expect((socket as any).worker.wss.pubSub.channels['hello world']).have.members(['broker', (socket as any).id]);
//             setTimeout(() => {
//               expect((socket as any).channels).to.not.contain.keys('hello world');
//               expect((socket as any).worker.wss.pubSub.channels['hello world']).to.be.undefined;
//               done();
//               this.server.close();
//             }, 10)
//           }, 10);
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(message))
//       setTimeout(() => {
//         socket.send(JSON.stringify(unsubscribeMessage));
//       }, 15);
//     });
//   });


//   it("Should publish message to correct channel if 'system publish' protocol message received ", (done) => {
//     const message = ['p', 'hello world channel', 'my super message'];
//     const subscribeMessage = ['s', 's', 'hello world channel'];

//     let server;
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         server = this.server;
//         this.wss.on('connection', (socket) => {

//         });
//       }
//     });


//     let socket1 = new WebSocket(websocketUrl);
//     socket1.on('open', () => {
//       socket1.send(JSON.stringify(subscribeMessage));
//       let socket2 = new WebSocket(websocketUrl);
//       socket2.on('open', () => {
//         socket2.send(JSON.stringify(subscribeMessage));
//         socket1.send(JSON.stringify(message));
//       })

//       socket2.on('message', (message) => {
//         setTimeout(() => {
//           expect(message).to.be.eql('["p",null,{"hello world channel":["my super message"]}]');
//           server.close()
//           done();
//         }, 20);
//       });
//     });

//     socket1.on('message', () => {
//       done('Socket1 should not receive message');
//     });
//   });
// });


// // Test to create correct message based on protocol  and send and receive (or raw message send)
// describe('WebSocket Server Should send end receive correct messages', () => {
//   it("Should receive correct message and send beck correctly structured message", (done) => {
//     let message = ['e', 'hello', 'world'];

//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           // we need timeout while we receive subscribe event
//           socket.on('hello', (incoming) => {
//             expect(incoming).to.be.eql(message[2]);
//             socket.send('hello', incoming);
//             this.server.close();
//           })
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(message))
//     });

//     socket.on('message', (incoming) => {
//       expect(incoming).to.be.eql(JSON.stringify(message));
//       done();
//     });
//   });

//   it("Should receive and send raw messages if needed with `sendRaw()` and on `message` (with out using CLusterWS protocol)", (done) => {
//     let message = 'hello';
//     let messageBack = 'world';

//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.on('connection', (socket) => {
//           // we need timeout while we receive subscribe event
//           socket.on('message', (incoming) => {
//             expect(incoming).to.be.eql(message);
//             socket.sendRaw(messageBack);
//             this.server.close();
//           })
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(message)
//     });

//     socket.on('message', (incoming) => {
//       expect(incoming).to.be.eql(messageBack);
//       done();
//     });
//   });
// })



// // TODO: Add middleware tests
// // TODO: Check another type of outcome
// describe('WebSocket Server Middleware', () => {
//   it("Should intercept user connection if `Middleware.verifyConnection` and decline if next passed decline", (done) => {
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.addMiddleware(Middleware.verifyConnection, (info, next) => {
//           next(false);
//           setTimeout(() => {
//             this.server.close();
//             done();
//           }, 20);
//         });

//         this.wss.on('connection', (socket) => {
//           // we need timeout while we receive subscribe event
//           done('Should not be called')
//         });
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       done('should not be called')
//     });
//   });


//   it("Should intercept and decline subscribe event if `Middleware.onSubscribe` is enabled and passed to decline", (done) => {
//     let subscribeEvent = ['s', 's', 'hello world'];
//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.addMiddleware(Middleware.onSubscribe, (socket, channel, next) => {
//           expect(channel).to.be.eql(subscribeEvent[2]);
//           next(new Error("Some error"))
//           setTimeout(() => {
//             expect(socket.channels).to.not.contain.keys('hello world');
//             this.server.close();
//             done();
//           }, 10);
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(subscribeEvent));
//     });
//   });


//   it("Should receive unsubscribe event in `Middleware.onUnsubscribe` and still unsubscribe channel", (done) => {
//     let subscribeEvent = ['s', 's', 'hello world'];
//     let unsubscribeEvent = ['s', 'u', 'hello world'];

//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.addMiddleware(Middleware.onUnsubscribe, (socket, channel) => {
//           expect(channel).to.be.eql(subscribeEvent[2]);
//           setTimeout(() => {
//             expect(socket.channels).to.not.contain.keys('hello world');
//             this.server.close();
//             done();
//           }, 10);
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(subscribeEvent));
//       socket.send(JSON.stringify(unsubscribeEvent));
//     });
//   });


//   it("Should receive open event in `Middleware.onChannelOpen` with channel name", (done) => {
//     let subscribeEvent = ['s', 's', 'hello world'];

//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.addMiddleware(Middleware.onChannelOpen, (channel) => {
//           expect(channel).to.be.eql(subscribeEvent[2]);
//           setTimeout(() => {
//             this.server.close();
//             done();
//           }, 10);
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(subscribeEvent));
//     });
//   });


//   it("Should receive close event in `Middleware.onChannelClose` (only if last user is unsubscribed) with channel name", (done) => {
//     let subscribeEvent = ['s', 's', 'hello world'];
//     let unsubscribeEvent = ['s', 'u', 'hello world'];

//     new ClusterWS({
//       ...options,
//       worker: function () {
//         this.wss.addMiddleware(Middleware.onChannelClose, (channel) => {
//           expect(channel).to.be.eql(subscribeEvent[2]);
//           setTimeout(() => {
//             this.server.close();
//             done();
//           }, 10);
//         })
//       }
//     });

//     let socket = new WebSocket(websocketUrl);
//     socket.on('open', () => {
//       socket.send(JSON.stringify(subscribeEvent));
//       // second one tests if we handle subscribe correctly
//       socket.send(JSON.stringify(subscribeEvent));

//       socket.send(JSON.stringify(unsubscribeEvent));
//     });
//   });
// });
