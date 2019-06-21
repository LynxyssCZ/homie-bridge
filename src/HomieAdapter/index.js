const HomieDevice = require('./HomieDevice')
const sensorNodeTemplates = require('./SensorNodeTemplates')
const sensorUpdateConvertors = require('./SensorUpdateConvertors')

class HomieAdapter {
	constructor (config, logger, mqttClient) {
		this.config = config
		this.logger = logger
		this.mqttClient = mqttClient
		this.isScanning = false
		this.device = new HomieDevice(this.mqttClient, config.homie.baseTopic, config.homie.id, config.homie.name)
	}

	async init (sensors) {
		this.device.addNode('bridge', 'Bridge controller', 'home-bridge', {
			'scanning': {
				name: 'Is Scanning',
				datatype: 'boolean',
				value: String(this.isScanning),
				onSet: this.onSetScanning.bind(this),
			},
			'discovered': {
				name: 'Discovered sensors',
				datatype: 'string',
				value: '',
				retained: false,
			},
			'sensors': {
				name: 'Configured sensors',
				datatype: 'string',
				value: '',
				onSet: this.onSetSensors.bind(this),
			}
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

	onSetScanning (value) {
		this.isScanning = value.toString() === 'true'
		this.device.getNode('bridge').setPropertyValue('scanning', String(this.isScanning)).catch(() => {})
	}

	onSetSensors () {}

	async handleSensorData (data) {
		if (sensorUpdateConvertors[data.type]) {
			const {nodeId, updates} = sensorUpdateConvertors[data.type](data)
			const node = this.device.getNode(nodeId)
			if (node) {
				for (const {property, value} of updates) {
					await node.setPropertyValue(property, value)
				}
			}
			if (this.isScanning) this.device.getNode('bridge').setPropertyValue('discovered', JSON.stringify(data))
		}
	}

	async start () {
		await this.device.setup()
	}

	async stop () {
		await this.device.disconnect()
	}
}

module.exports = HomieAdapter
