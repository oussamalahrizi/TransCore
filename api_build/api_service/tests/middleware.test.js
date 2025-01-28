const WebSocket = require('ws');

const token = ""

const wsUrl = `ws://api-service/ws`;

const ws = new WebSocket(wsUrl);

ws.on('open', function open() {
    console.log('Connected to WebSocket');
});

ws.on('message', function message(data) {
    console.log('Received:', data);
});

ws.on('close', function close(code, reason) {
    console.log(`Disconnected from WebSocket: ${code} - ${reason}`);
});

ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
});
