var path = require('path')
var express = require('express')
var ClusterWS = require('../dist/index').ClusterWS

let clusterWs = new ClusterWS({
    worker: Worker,
    workers: 8,
    pingInterval: 5000
})


function Worker() {
    var httpServer = this.httpServer
    var socketServer = this.socketServer
    let app = express()
    app.use('/', express.static(path.join(__dirname + '/public')))

    this.httpServer.on('request', app)

    this.socketServer.on('connection', (socket) => {

        this.socketServer.publish('world', 'i am on world')
        this.socketServer.publish('ssss', 'i am on world')


        socket.on('hello', (data) => {
            console.log(data)
        })
        socket.send('hello')

        socket.on('disconnect', (code, msg) => {
            console.log('Socket disconnected ' + code + ' ' + msg)
        })
    })
}
