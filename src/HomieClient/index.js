const Device = require('./Device')
const sensorNodeTemplates = require('./SensorNodeTemplates')
const sensorUpdateConvertors = require('./SensorUpdateConvertors')

class HomieClient {
	constructor (config, logger, mqttClient) {
		this.config = config
		this.logger = logger
		this.mqttClient = mqttClient
		this.device = new Device(this.mqttClient, config.homie.baseTopic, config.homie.id, config.homie.name)
	}

	async init (sensors) {
		this.device.addNode('bridge', 'Bridge controller', 'home-bridge', {
			'scanning': {
				name: 'Is Scanning',
				datatype: 'boolean',
				settable: 'true',
				value: 'false',
			},
			'discovered': {
				name: 'Discovered devices',
				datatype: 'string',
				value: '',
			},
		})

		this.addSensors(sensors)
	}

	addSensors (sensors) {
		for (const sensor of sensors) {
			if (sensorNodeTemplates[sensor.type]) {
				const {id, name, type, properties} = sensorNodeTemplates[sensor.type](sensor)
				this.device.addNode(id, name, type, properties)
			}
		}
	}

	async handleSensorData (data) {
		if (sensorUpdateConvertors[data.type]) {
			const {nodeId, updates} = sensorUpdateConvertors[data.type](data)
			const node = this.device.getNode(nodeId)
			for (const {property, value} of updates) {
				await node.setPropertyValue(property, value)
			}
		}
	}

	async start () {
		await this.device.setup()
	}

	async stop () {
		await this.device.disconnect()
	}
}

module.exports = HomieClient
