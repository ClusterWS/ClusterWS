/* tslint:disable */
import { PubSubEngine } from './pubsub';

// TODO: remove this file and use one general benchmark file

const pubSub = new PubSubEngine();

const numberOfUsers = 20000; // number of registered users
const channelsPerUser = 200; // overall number of channels per user
const channelsShifting = 50; // number of unique channels create per user

let sentMessages = 0;
let receivedMessages = 0;

console.time("Register and Subscribe");
let shift = 0;
for (let i: number = 0; i < numberOfUsers; i++) {
  const userId = `registeredUserId_${i}`;
  pubSub.register(userId, (msg) => {
    // This is received bulk message
    // therefore receivedMessages count
    // will be lower from sentMessage count
    // as a simple solution we can use Object.keys(msg).length
    // to find exact butch count
    receivedMessages++;
  });

  for (let j: number = 0 + shift; j < channelsPerUser + shift; j++) {
    pubSub.subscribe(userId, [`some strange channel name for now ${j}`]);
  }
  shift += channelsShifting;
}

console.log(pubSub.getStats());
console.timeEnd("Register and Subscribe");

// Publish load test
const numberOfUsersToPublishPerIteration = 50; // number of users to publish per iteration
const numberOfChannelsPerUser = 50; // number of channels per user to publish
const iterationTime = 1; // iteration in ms
const metricsPrintTime = 5000; // in ms

const messageToPublish = JSON.stringify({
  msg: 'Simple message to send'
});

let publishUsersShift = 0;
setInterval(() => {
  for (let i: number = 0 + publishUsersShift; i < numberOfUsersToPublishPerIteration + publishUsersShift; i++) {
    let channelsShift = i * channelsShifting;
    for (let j: number = 0 + channelsShift; j < numberOfChannelsPerUser + channelsShift; j++) {
      sentMessages++;
      pubSub.publish(`some strange channel name for now ${j}`, messageToPublish, `registeredUserId_${i}`);
    }
  }

  publishUsersShift += numberOfUsersToPublishPerIteration;
  if (publishUsersShift >= numberOfUsers) {
    publishUsersShift = 0;
  }
}, iterationTime);


let startTime = new Date().getTime();
setInterval(() => {
  let diff = new Date().getTime() - startTime;
  startTime = new Date().getTime();
  console.log(`Published ${Math.floor(sentMessages / (diff / 1000))} per second, received ${Math.floor(receivedMessages / (diff / 1000))} per second`);
  sentMessages = 0;
  receivedMessages = 0;
}, metricsPrintTime);
