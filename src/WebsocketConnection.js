var ws = new WebSocket('ws://127.0.0.1:1234', 'echo-protocol');

function sendMessage(){
    ws.send('hello from client');
}

ws.addEventListener("message", function(e) {
    console.log(e.data);
});

client.onclose = function() {
    console.log('echo-protocol Client Closed');
};

client.onmessage = function(e) {
    if (typeof e.data === 'string') {
        console.log("Received: '" + e.data + "'");
    }
};
