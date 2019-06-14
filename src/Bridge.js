const MQTTClient = require('./MqttClient')
const SensorParser = require('./SensorParser')
const SensorReader = require('./SensorReader')
const HomieClient = require('./HomieClient')

class Bridge {
	constructor (config, settingsStore, logger) {
		this.config = config
		this.settingsStore = settingsStore
		this.logger = logger
		this.reader = new SensorReader(config, logger)
		this.reader.consume((message) => {
			this.onSensorMessage(message).catch(() => {})
		})

		this.parser = new SensorParser(config, logger)
		this.mqttClient = new MQTTClient(config, logger)
		this.homieClient = new HomieClient(config, logger, this.mqttClient)
	}

	async onSensorMessage (message) {
		const data = await this.parser.parse(message)
		if (data) {
			try {
				await this.homieClient.handleSensorData(data)
			}
			catch (e) {
				this.logger.error({
					path: 'bridge',
					message: 'Sensor message publish failed',
					payload: {e},
				})
			}
		}
	}

	async init () {
		await this.mqttClient.init()
		await this.homieClient.init(this.settingsStore.get('homieSensors'))
		await this.reader.init()
		await this.parser.init()
	}

	async start () {
		await this.mqttClient.start()
		await this.homieClient.start()
		await this.reader.start()
	}

	async stop () {
		await this.reader.stop()
		await this.mqttClient.stop()
	}
}

module.exports = Bridge
