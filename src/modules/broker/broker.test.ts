import { expect } from 'chai';
import { BrokerServer } from './server';
import { BrokerClient } from './client';
import { WSEngine } from '../engine';

describe('Broker', () => {
  before((done: any) => {
    this.wsServer = new BrokerServer({
      port: 3000,
      engine: WSEngine.CWS,
      onReady: (): void => {
        done();
      },
      onError: (_: any, error: Error): void => {
        console.log('Error', error);
      }
    });
  });

  it('After client connected server should add client to all sockets', (done: any) => {
    this.client = new BrokerClient({
      url: 'ws://localhost:3000',
      engine: WSEngine.CWS,
      onRegister: (): void => {
        expect(this.wsServer.sockets.length).to.be.eql(1);
        done();
      }
    });
  });

  it('After client disconnects server should remove client', (done: any) => {
    this.client.reconnect = (): void => {
      // remove reconnect loop validate if server has removed client
      setTimeout(() => {
        expect(this.wsServer.sockets.length).to.be.eql(0);
        done();
      }, 50);
    };
    this.client.socket.close();
  });

  it('Should reconnect to the server if connection lost and trigger unregister', (done: any) => {
    let triggered: number = 0;
    this.client = new BrokerClient({
      url: 'ws://localhost:3000',
      engine: WSEngine.CWS,
      onRegister: (): void => {
        triggered++;

        if (triggered === 3) {
          expect(this.wsServer.sockets.length).to.be.eql(1);
          return done();
        }
        this.client.socket.close();
      },
      onUnregister: (): void => {
        // run things
        triggered++;
      }
    });
  }).timeout(5000);
});