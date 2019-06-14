require('dotenv-expand')(require('dotenv').config())

module.exports = {
	mqtt: {
		connection: process.env.MQTT_BROKER,
		options: {
			clean: process.env.MQTT_CLIENT_ID ? false : true,
			clientId: process.env.MQTT_CLIENT_ID,
		},
	},
	homie: {
		baseTopic: process.env.HOMIE_BASE_TOPIC || 'homie',
		id: 'home-bridge',
		name: 'Sensor Bridge',
	},
	logger: {
		level: 'verbose',
	},
}
