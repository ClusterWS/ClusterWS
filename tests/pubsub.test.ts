import { expect } from 'chai';
import { PubSubEngine } from '../src/modules/pubsub/pubsub';

describe('PubSub Creation', () => {
  before(() => {
    this.pubSub = new PubSubEngine();
  });

  it('Should register user properly', () => {
    const registerUser: string = 'my_user_id';
    this.pubSub.register(registerUser, () => { /** Ignore */ });
    expect((this.pubSub as any).usersLink).to.contain.keys(registerUser);
  });

  it('Should subscribe existing user properly', () => {
    const registerUser: string = 'my_user_id';
    const subscribeChannel: string = 'my_channel';
    this.pubSub.subscribe(registerUser, [subscribeChannel]);

    expect((this.pubSub as any).usersLink[registerUser].channels).to.contain(subscribeChannel);
    expect((this.pubSub as any).channelsUsers).to.contain.keys(subscribeChannel);
    expect((this.pubSub as any).channelsUsers[subscribeChannel]).to.contain.keys(registerUser);
    expect((this.pubSub as any).channelsUsers[subscribeChannel].len).to.be.eq(1);
  });

  it('Should unsubscribe from existing channel', () => {
    const registerUser: string = 'my_user_id';
    const unSubscribeChannel: string = 'my_channel';
    this.pubSub.unsubscribe(registerUser, [unSubscribeChannel]);

    expect((this.pubSub as any).usersLink[registerUser].channels).to.not.contain(unSubscribeChannel);
    expect((this.pubSub as any).channelsUsers).to.not.contain.keys(unSubscribeChannel);
  });

  it('Should unregister user and unsubscribe from subscribed channels', () => {
    const registerUser: string = 'my_user_id';
    const subscribeChannel: string = 'my_channel';
    this.pubSub.subscribe(registerUser, [subscribeChannel]);

    this.pubSub.unregister(registerUser);

    expect((this.pubSub as any).usersLink).to.not.contain.keys(registerUser);
    expect((this.pubSub as any).channelsUsers).to.not.contain.keys(subscribeChannel);
  });
});

describe('PubSub Publish', () => {
  beforeEach(() => {
    this.pubSub = new PubSubEngine();
  });

  it('Should publish message to user', (done: any) => {
    const registerUser: string = 'my_user_id';
    const messageToPublish: string = 'My super message';
    const channel: string = 'new_channel';

    this.pubSub.register(registerUser, (msg: any) => {
      expect(msg).to.contain.keys(channel);
      expect(msg[channel][0]).to.be.eq(messageToPublish);
      done();
    });

    this.pubSub.subscribe(registerUser, [channel]);
    this.pubSub.publish(channel, messageToPublish);
  });

  it('Should publish message to multiple users', (done: any) => {
    const registerUser: string = 'my_user_id';
    const registerUser2: string = 'my_user_id_2';

    const messageToPublish: string = 'My super message';
    const channel: string = 'new_channel';

    let exec: number = 0;

    this.pubSub.register(registerUser, (msg: any) => {
      expect(msg).to.contain.keys(channel);
      expect(msg[channel][0]).to.be.eq(messageToPublish);
      exec++;

      if (exec > 1) {
        done();
      }
    });

    this.pubSub.register(registerUser2, (msg: any) => {
      expect(msg).to.contain.keys(channel);
      expect(msg[channel][0]).to.be.eq(messageToPublish);
      exec++;

      if (exec > 1) {
        done();
      }
    });

    this.pubSub.subscribe(registerUser, [channel]);
    this.pubSub.subscribe(registerUser2, [channel]);

    this.pubSub.publish(channel, messageToPublish);
  });

  it('GLOBAL user should get all messages', (done: any) => {
    const messageToPublish: string = 'My super message';
    const channel: string = 'some_random_channel';

    this.pubSub.register(PubSubEngine.GLOBAL_USER, (msg: any) => {
      expect(msg).to.contain.keys(channel);
      expect(msg[channel][0]).to.be.eq(messageToPublish);
      done();
    });

    this.pubSub.publish(channel, messageToPublish);
  });

  it('Unsubscribed user Should not get published message', (done: any) => {
    const registerUser: string = 'my_user_id';
    const messageToPublish: string = 'My super message';
    const channel: string = 'new_channel';

    this.pubSub.register(registerUser, (msg: any) => {
      done(`Should not receive message but got ${JSON.stringify(msg)}`);
    });

    this.pubSub.subscribe(registerUser, [channel]);
    this.pubSub.unsubscribe(registerUser, [channel]);
    this.pubSub.publish(channel, messageToPublish);

    setTimeout(() => done(), 100);
  });
});

describe('PubSub onChannelCreated and onChannelDestroyed', () => {
  before(() => {
    this.pubSub = new PubSubEngine();
  });

  it('Should trigger onChannelCreated listener if channel does not exits', (done: any) => {
    const registerUser: string = 'my_user_id';
    const channel: string = 'new_channel';

    this.pubSub.onChannelCreated(() => {
      done();
    });

    this.pubSub.register(registerUser, (msg: any) => { /** ignore */ });
    this.pubSub.subscribe(registerUser, [channel]);
  });

  it('Should trigger onChannelDestroyed when no one listens to the channel', (done: any) => {
    const registerUser: string = 'my_user_id';

    this.pubSub.onChannelDestroyed(() => {
      done();
    });

    this.pubSub.unregister(registerUser);
  });
});