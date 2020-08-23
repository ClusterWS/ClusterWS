import { expect } from 'chai';
import { Networking } from '../src/broker/networking';
import { Socket, Server, createServer, connect } from 'net';

describe('Networking: Server and Client', () => {
  it('Should call "open" listener on successful connection', (done) => {
    const server: Server = createServer((rawSocket: Socket) => { /** */ });
    server.listen(3000);

    const socket: Networking = new Networking(connect({ port: 3000 }));
    socket.on('open', () => {
      server.close();
      done();
    });
  });

  it('Should trigger connect on the server side', (done) => {
    const server: Server = createServer((rawSocket: Socket) => {
      server.close();
      done();
    });
    server.listen(3000);

    new Networking(connect({ port: 3000 }));
  });

  it('Should send and receive full messages', (done) => {
    const message: string = 'Simple test message to send between server and client';

    const server: Server = createServer((rawSocket: Socket) => {
      const serverSocket: Networking = new Networking(rawSocket);
      serverSocket.on('message', (buffer) => {
        const received: string = buffer.toString();
        expect(received).to.eql(message);
        serverSocket.send(buffer);
      });
    });

    server.listen(3000);

    const socket: Networking = new Networking(connect({ port: 3000 }));
    socket.on('open', () => {
      socket.send(message);
    });

    socket.on('message', (buffer) => {
      const received: string = buffer.toString();
      expect(received).to.eql(message);
      server.close();
      done();
    });
  });
});