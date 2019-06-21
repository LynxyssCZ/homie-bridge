class DeviceNode {
	constructor (mqttClient, baseTopic, id, name, type, properties) {
		this.mqttClient = mqttClient
		this.baseTopic = `${baseTopic}/${id}`
		this.name = name
		this.type = type
		this.properties = new Map()

		for (const [id, property] of Object.entries(properties)) this.addProperty(id, property)

		this.handleMessage = this.handleMessage.bind(this)
	}

	addProperty (id, attributes) {
		this.properties.set(id, attributes)
	}

	handleMessage (topic, message) {
		
	}

	async setPropertyValue (id, value) {
		this.properties.set(id, {
			...this.properties.get(id),
			value,
		})
		await this.publish(`${id}`, value)
	}

	async setup () {
		await this.publish('$name', this.name)
		await this.publish('$type', this.type)
		const properties = []
		for (const [id, property] of this.properties.entries()) {
			await Promise.all([
				async () => {
					if (property.hasOwnProperty('value')) {
						await this.publish(`${id}`, property.value)
					}
				},
				this.publish(`${id}/$name`, property.name),
				this.publish(`${id}/$datatype`, property.datatype),
				this.publish(`${id}/$settable`, property.settable || 'false'),
				this.publish(`${id}/$retained`, property.retained || 'true'),
			])

			properties.push(id)
		}
		await this.publish('properties', properties.join(','))
	}

	async publish (topic, payload, retain = true) {
		await this.mqttClient.publish(`${this.baseTopic}/${topic}`, payload, {
			qos: 2,
			retain,
		})
	}
}

module.exports = DeviceNode
