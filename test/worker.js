var express = require('express');
var path = require('path');

module.exports = function(worker){
    // var app = express();
    // var httpServer = worker.httpServer;
    var webSocketServer = worker.webSocketServer;

    // app.use('/', express.static(path.join(__dirname + '/public')));
    //
    // httpServer.on('request', app);

    webSocketServer.on('connection', function(socket){

       webSocketServer.publish('food');
       webSocketServer.publish('food', {object: 'I am object', bool: true, numb: 2, undefinedVar: undefined, myNull: null, arr: [2,3,4,5] , some:{here:true}});
       webSocketServer.publish('food', null);
       webSocketServer.publish('food', true);
       webSocketServer.publish('food', false);
       webSocketServer.publish('food', 'string');
       webSocketServer.publish('food', undefined);
       webSocketServer.publish('food', Number(2));
       webSocketServer.publish('food', 1);
        ;
       //
       // socket.send('hello');
       // socket.send('hello', {object: 'I am object', bool: true, numb: 2, undefinedVar: undefined, myNull: null, arr: [2,3,4,5] , some:{here:true}});
       // socket.send('hello', null);
       // socket.send('hello', true);
       // socket.send('hello', false);
       // socket.send('hello', 'string');
       // socket.send('hello', undefined);
       // socket.send('hello', Number(2));
       // socket.send('hello', 1);
    })
};