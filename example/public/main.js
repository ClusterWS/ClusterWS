var socket = new WebSocket('ws://localhost:80')


socket.onopen = function () {
    socket.send(JSON.stringify({ 'm': ['e', 'hello', 'hello'] }))
}

socket.onerror = (err) => {
    console.log(err)
}

socket.onmessage = (msg) => {
    console.log(msg.data)
}
socket.onclose = (code, msg) => {
    console.log('close')
}
// socket = new ClusterWS({
//     url: 'localhost',
//     port: 80
// });

// var channel;
// socket.on('connect', function(){
//     console.log('Connected to the socket');
//     channel = socket.subscribe('home').watch(function(data){
//         console.log(data);
//     }).publish('I am home');
//     // socket.disconnect(1000, 'I am best');
// });

// socket.on('hello', function(data){
//     console.log(data);
// });

// socket.on('disconnect', function(code, message){
//     console.log('In index:', code, message);
// });


// function myFunction() {
//     channel.publish({place:'Home'});
// }
