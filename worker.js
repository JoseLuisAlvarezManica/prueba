let client = null;

function setupMQTTClient() {
    client = mqtt.connect('wss://c5bbc4def6e34541aef584dd75d7cff7.s1.eu.hivemq.cloud:8884/mqtt', {
        clientId: 'yourClientId',
        username: 'prueba',
        password: 'prueba123',
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
    });

    client.on('connect', () => {
        console.log('MQTT Client Connected');
        self.postMessage({ status: 'connected' });
    });

    client.on('error', function (err) {
        console.error('Error connecting to MQTT broker:', err);
        client.end();
        self.postMessage({ status: 'error', error: err.message });
    });
}

self.onmessage = function(e) {
    const { type, positionMessage } = e.data;

    switch (type) {
        case 'connect':
            if (!client) {
                setupMQTTClient();
            }
            break;
        case 'publish':
            if (client) {
                client.publish('position/topic', positionMessage, {}, (error) => {
                    if (error) {
                        console.error('Publish error:', error);
                        self.postMessage({ status: 'publish_error', error: error.message });
                    } else {
                        self.postMessage({ status: 'published', message: positionMessage });
                    }
                });
            } else {
                console.error('Client not connected');
                self.postMessage({ status: 'not_connected' });
            }
            break;
        case 'disconnect':
            if (client) {
                client.end(false, {}, () => {
                    console.log('Client disconnected');
                    self.postMessage({ status: 'disconnected' });
                    client = null; // Clear the client instance
                });
            }
            break;
    }
};





