var socket;
socket = new ClusterWS({
    url: 'localhost',
    port: 3000
});

socket.on('connect', function(){
    console.log('Connected to the socket');
});

socket.on('hello', function(data){
    console.log(data);
});

socket.on('disconnect', function(code, message){
    console.log('In index:', code, message);
});
