const {EventEmitter} = require('events')
const mqtt = require('async-mqtt')

class MQTTClient extends EventEmitter {
	constructor (config, logger) {
		super()
		this.config = config
		this.logger = logger
		this.client = null
	}

	get connected () {
		return this.client.connected
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

	async subscribe (topic, options = {}) {
		this.logger.verbose({
			path: 'MQTTClient',
			message: 'subscribing',
			payload: {topic},
		})
		await this.client.subscribe(topic, options)
	}

	async start () {
		return new Promise((resolve) => {
			this.client = mqtt.connect(this.config.mqtt.connection, this.config.mqtt.options)
			this.client.once('connect', resolve)
			this.client.on('connect', () => this.emit('connect'))
			this.client.on('reconnect', () => this.emit('reconnect'))
			this.client.on('disconnect', () => this.emit('disconnect'))
			this.client.on('offline', () => this.emit('offline'))
			this.client.on('error', () => this.emit('error'))
			this.client.on('message', (...args) => this.emit('message', ...args))
		})
	}

	async stop () {
		await this.client.end()
	}
}

module.exports = MQTTClient
