var socket;
socket = new ClusterWS({
    url: 'localhost',
    port: 3000
});

var channel;
socket.on('connect', function(){
    console.log('Connected to the socket');
    channel = socket.subscribe('home').watch(function(data){
        console.log(data);
    }).publish(' I am home');
});

socket.on('hello', function(data){
    console.log(data);
});

socket.on('disconnect', function(code, message){
    console.log('In index:', code, message);
});



function myFunction() {
    channel.publish({place:'Home'});
}
