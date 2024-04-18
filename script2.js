const client = mqtt.connect('wss://c5bbc4def6e34541aef584dd75d7cff7.s1.eu.hivemq.cloud:8884/mqtt', {
    clientId: 'yourClientId',
    username: 'prueba',
    password: 'prueba123',
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
});

client.on('connect', () => {
    console.log('MQTT Client Connected');
});

// Assume this function is called within your existing detection loop
function displayVideoDetections(result) {
    // Existing code to handle video detections...
    result.detections.forEach((detection) => {
        const message = JSON.stringify({
            type: detection.categories[0].categoryName,
            confidence: detection.categories[0].score
        });

        // Publish the message to a topic
        client.publish('detection/topic', message, {}, (error) => {
            if (error) {
                console.error('Publish error:', error);
            }
        });
    });
}