import { expect } from 'chai';
import { PubSubEngine } from './pubsub';

describe('Register, Subscribe, Unsubscribe, Unregister', () => {
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