const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com');

console.log('Connecting to HiveMQ...');

client.on('connect', () => {
  console.log('Connected. Listening for GasGuard messages for 15 seconds...');
  client.subscribe('gasguard/telemetry');
  client.subscribe('gasguard/alert');
});

client.on('message', (topic, message) => {
  console.log(`[${new Date().toLocaleTimeString()}] Topic: ${topic}`);
  console.log(`Payload: ${message.toString()}`);
});

setTimeout(() => {
  console.log('Timeout reached. Closing listener.');
  client.end();
  process.exit(0);
}, 15000);
