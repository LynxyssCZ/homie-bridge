const mqtt = require('async-mqtt')

class MQTTClient {
	constructor (config, logger) {
		this.config = config
		this.logger = logger
		this.client = null
	}

	getClient () {
		return this.client
	}

	async publish (topic, message, options) {
		this.logger.verbose({
			path: 'MQTTClient',
			message: 'publishing message',
			payload: {topic, message, options},
		})
		await this.client.publish(topic, message, options)
	}

	async subscribe () {

	}

	async init () {}

	async start () {
		return new Promise((resolve) => {
			this.client = mqtt.connect(this.config.mqtt.connection, this.config.mqtt.options)
			this.client.on('connect', resolve)
		})
	}

	async stop () {
		await this.client.end()
	}
}

module.exports = MQTTClient
