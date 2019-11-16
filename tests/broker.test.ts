import { expect } from 'chai';
import { BrokerServer } from '../src/modules/broker/server';
import { BrokerClient } from '../src/modules/broker/client';

describe('Broker', () => {
  before((done: any) => {
    this.wsServer = new BrokerServer();
    this.wsServer.listen(3000, () => {
      done();
    });
  });

  it('After client connected server should add client to all sockets', (done: any) => {
    this.client = new BrokerClient({ port: 3000 });
    this.client.onOpen(() => {
      expect(this.wsServer.connectedClients.length).to.be.eql(1);
      done();
    });
  });

  it('After client disconnects server should remove client', (done: any) => {
    this.client.reconnect = (): void => {
      // remove reconnect loop validate if server has removed client
      setTimeout(() => {
        expect(this.wsServer.connectedClients.length).to.be.eql(0);
        done();
      }, 50);
    };
    this.client.socket.close();
  });

  it('Should reconnect to the server if connection lost and trigger unregister', (done: any) => {
    let triggered: number = 0;
    this.client = new BrokerClient({ port: 3000 });
    this.client.onOpen(() => {
      triggered++;

      if (triggered === 3) {
        expect(this.wsServer.connectedClients.length).to.be.eql(1);
        return done();
      }
      this.client.socket.close();
    });

    this.client.onClose(() => {
      triggered++;
    });
  }).timeout(5000);
});