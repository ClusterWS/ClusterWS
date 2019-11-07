import { BrokerClient } from './client';

export class BrokerPool {
  private brokers: BrokerClient[] = [];
  private nextSend: number = 0;

  private onMessageListener: (message: Buffer) => void;
  private onOpenSendMessageConstructor: () => string;

  constructor(private brokersLinks: string[]) {
    for (let i: number = 0, len: number = this.brokersLinks.length; i < len; i++) {
      this.registerBroker(new BrokerClient(this.brokersLinks[i]));
    }
  }

  public send(message: string): void {
    // TODO: implement queue and retry to next broker on write fail
    const availableBrokers: number = this.brokers.length;

    if (!availableBrokers) {
      return;
    }

    if (this.nextSend >= availableBrokers) {
      this.nextSend = 0;
    }

    this.brokers[this.nextSend].send(message);
    this.nextSend++;
  }

  public broadcast(message: string): void {
    for (let i: number = 0, len: number = this.brokers.length; i < len; i++) {
      this.brokers[i].send(message);
    }
  }

  public sendOnEachOpen(messageConstructor: () => string): void {
    this.onOpenSendMessageConstructor = messageConstructor;
  }

  public onMessage(listener: (message: Buffer) => void): void {
    this.onMessageListener = listener;
  }

  private registerBroker(broker: BrokerClient): void {
    broker.onMessage((message: Buffer) => {
      this.onMessageListener(message);
    });

    broker.onOpen(() => {
      broker.send(this.onOpenSendMessageConstructor());
      this.brokers.push(broker);
    });

    broker.onClose(() => {
      this.unregisterBroker(broker);
    });

    broker.onError(() => {
      this.unregisterBroker(broker);
    });
  }

  private unregisterBroker(broker: BrokerClient): void {
    for (let i: number = 0, len: number = this.brokers.length; i < len; i++) {
      const brokerClient: BrokerClient = this.brokers[i];
      if (brokerClient.id === broker.id) {
        this.brokers.splice(i, 1);
        break;
      }
    }
  }
}