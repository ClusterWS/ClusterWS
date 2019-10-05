// Test template
/* tslint:disable */
import { connect } from 'net';
import { Networking } from './networking';

const path: string = './socket.unix';

let baseSet = {
  "_id": "5d946aa044c887c1ea19e299",
  "index": 0,
  "guid": "7f85f3f1-f0c6-4425-8ed5-debb813b0007",
  "isActive": false,
  "balance": "$3,172.58",
  "picture": "http://placehold.it/32x32",
  "age": 36,
  "eyeColor": "blue",
  "name": "Gutierrez Hartman",
  "gender": "male",
  "company": "SAVVY",
  "email": "gutierrezhartman@savvy.com",
  "phone": "+1 (905) 436-2556",
  "address": "139 Sumpter Street, Craig, Northern Mariana Islands, 6085",
  "about": "Deserunt adipisicing reprehenderit veniam laborum labore consequat commodo sunt minim laborum laborum duis sunt. Deserunt magna ut aliqua ipsum cillum do ea sint ea consequat ut ad ipsum. Culpa dolor irure laborum ea magna irure ullamco cupidatat exercitation consectetur ut. Magna non non occaecat proident ea non esse aliqua labore Lorem reprehenderit reprehenderit sint. Laboris do incididunt duis dolore mollit officia esse ea mollit ad ad Lorem. Occaecat consequat officia eiusmod pariatur cupidatat consequat.\r\n",
  "registered": "2015-06-11T12:27:16 -12:00",
  "latitude": 25.592435,
  "longitude": 85.073894,
  "tags": [
    "sunt",
    "ea",
    "reprehenderit",
    "incididunt",
    "et",
    "sunt",
    "nisi"
  ],
  "friends": [
    {
      "id": 0,
      "name": "Garrett Cooley"
    },
    {
      "id": 1,
      "name": "Wiggins Skinner"
    },
    {
      "id": 2,
      "name": "Kristin Lara"
    }
  ],
  "greeting": "Hello, Gutierrez Hartman! You have 4 unread messages.",
  "favoriteFruit": "banana"
};

let largeMessage = [];
for (let i = 0; i < 10000; i++) {
  largeMessage.push(baseSet);
}

function roughSizeOfObject(object) {
  return JSON.stringify(object).length * 2;
}

console.log(roughSizeOfObject(largeMessage));

const socket: any = connect({ path, port: 3000, host: '127.0.0.1' });
socket.setNoDelay(true);
socket.networking = new Networking(socket);
let maxTime = 0;
socket.networking.onMessage((message: string) => {
  // console.log(message);
  const time: string = JSON.parse(message)['hello world'][1];
  if (maxTime < new Date().getTime() - parseInt(time, 10)) {
    if (new Date().getTime() - parseInt(time, 10) > 10000) {
      console.log(message);
    }
    maxTime = new Date().getTime() - parseInt(time, 10);
  }
  // console.log('Round trip', new Date().getTime() - parseInt(time, 10) + 'ms');
});

setInterval(() => {
  console.log('Max round trip ', maxTime, 'ms');
  maxTime = 0;
}, 5000);


function send() {
  setTimeout(() => {
    socket.networking.send(JSON.stringify({
      'hello world': ['hello from ' + process.pid, new Date().getTime()],
    }), () => {
      send();
    });
  }, 20);
}

socket.on('connect', () => {
  socket.networking.send('shello world');
  send();
  // setInterval(() => {
  //   socket.networking.send(JSON.stringify({
  //     'hello world': ['hello from ' + process.pid, new Date().getTime()],
  //   }));
  // }, 10);

  // setTimeout(() => {
  //   socket.networking.send('uhello world');
  // }, 10000);
  // setInterval(() => {
  //   socket.networking.send(new Date().getTime() + '');
  // }, 1000);
});

socket.on('error', (err) => {
  console.log('Got error', err);
});