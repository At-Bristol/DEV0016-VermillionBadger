var PORT = 110000;
var HOST = '127.0.0.1';

var http = require('http');
var dgram = require('dgram');
var WebSocketServer = require('websocket').server;

var server = dgram.createSocket('udp4');

var coords
var connection = null;

server.on('listening', function () {
    var address = server.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +' - ' + message);
    if(connection){
        connection.sendUTF(message)
    }

});

server.bind(PORT, HOST);

//////
var httpserver = http.createServer(function(request, response) {});

httpserver.listen(1234, function() {
    console.log((new Date()) + ' httpServer is listening on port 1234');
});

var wsServer = new WebSocketServer({
    httpServer: httpserver
});

wsServer.on('request', function(r){

    connection = r.accept('echo-protocol', r.origin);
    console.log((new Date()) + ' Connection accepted from client');


    connection.on('close', function(reasonCode, description) {
        delete client;
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

});
