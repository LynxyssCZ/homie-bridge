const config = require('./config')
const mqtt = require('async-mqtt')

const client = mqtt.connect(config.mqtt.connection, config.mqtt.options)
client.once('connect', async () => {
	await client.subscribe('lHomie/home-bridge/+/+/set', {qos: 2})
	client.on('message', console.log)
})
