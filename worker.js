self.onmessage = function(e) {
    e.data = positionMessage
    const client = mqtt.connect('wss://c5bbc4def6e34541aef584dd75d7cff7.s1.eu.hivemq.cloud:8884/mqtt', {
        clientId: 'yourClientId',
        username: 'prueba',
        password: 'prueba123',
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
});
}

client.on('connect', () => {
    console.log('MQTT Client Connected');
});

client.on('error', function (err) {
    console.log('Error connecting to MQTT broker:', err);
    client.end();
});

client.publish('position/topic', positionMessage, {}, (error) => {
    if (error) {
        console.error('Publish error:', error);
    }
});

if (client) {
    client.end(false, {}, () => {
        console.log('Client disconnected');
        self.postMessage({ status: 'disconnected' });
        client = null; // Clear the client instance
    });
}

close();

