import { expect } from 'chai';
import { BrokerServer } from './server';
import { BrokerClient } from './client';
import { WSEngine } from '../engine';


describe('Broker', () => {
  before((done: any) => {
    this.wsServer = new BrokerServer({
      port: 3000,
      engine: WSEngine.CWS,
      onReady: () => {
        done();
      },
      onError: (_, error: Error) => {
        console.log('Error', error);
      }
    });
  });

  it('After client connected server should add client to all sockets', (done: any) => {
    this.client = new BrokerClient({
      url: 'ws://localhost:3000',
      engine: WSEngine.CWS,
      onRegister: () => {
        expect(this.wsServer.sockets.length).to.be.eql(1);
        done();
      }
    });
  });

  it('After client disconnects server should remove client', (done: any) => {
    this.client.reconnect = () => {
      // remove reconnect loop validate if server has removed client
      setTimeout(() => {
        expect(this.wsServer.sockets.length).to.be.eql(0);
        done();
      }, 50);
    };
    this.client.socket.close();
  });
});