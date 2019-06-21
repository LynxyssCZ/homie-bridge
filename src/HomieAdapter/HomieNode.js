class DeviceNode {
	constructor (mqttClient, baseTopic, id, name, type, properties) {
		this.mqttClient = mqttClient
		this.baseTopic = `${baseTopic}/${id}`
		this.name = name
		this.type = type
		this.properties = new Map()

		for (const [id, property] of Object.entries(properties)) this.addProperty(id, property)
	}

	addProperty (id, attributes) {
		this.properties.set(id, attributes)
	}

	handlePropertySet (propertyId, message) {
		const property = this.properties.get(propertyId)
		if (property && property.onSet) property.onSet(message)
	}

	async setPropertyValue (id, value) {
		const property = this.properties.get(id)

		this.properties.set(id, {
			...property,
			value,
		})
		await this.publish(`${id}`, value, property.retained !== false)
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
				this.publish(`${id}/$settable`, String(!!property.onSet)),
				this.publish(`${id}/$retained`, String(property.retained !== false)),
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
