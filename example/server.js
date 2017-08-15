var path = require('path')
var express = require('express')
var ClusterWS = require('../dist/index').ClusterWS


let clusterWs = new ClusterWS({
    worker: Worker,
    workers: 2,
    pingInterval: 5000
})


function Worker() {
    let app = express()
    app.use('/', express.static(path.join(__dirname + '/public')))

    this.httpServer.on('request', app)

    this.socketServer.on('connection', (socket) => {

        this.publish('world', 'i am on world')

        socket.on('hello', (data) => {
            console.log(data)
        })
        socket.send('hello', 'i am working')

        socket.on('disconnect', (code, msg) => {
            console.log('Socket disconnected ' + code + ' ' + msg)
        })
    })
}
