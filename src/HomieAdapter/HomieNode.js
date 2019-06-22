class DeviceNode {
	constructor (mqttClient, baseTopic, id, name, type, properties) {
		this.mqttClient = mqttClient
		this.baseTopic = `${baseTopic}/${id}`
		this.name = name
		this.type = type
		this.properties = new Map()

		for (const [id, property] of Object.entries(properties)) this.addProperty(id, property)
		this.setupCalled = false
		this.handleMessage = this.handleMessage.bind(this)
	}

	async addProperty (id, attributes) {
		this.properties.set(id, {
			...attributes,
			changed: false,
		})
	
		if (this.setupCalled && this.mqttClient.connected) {
			await this.setupProperty(id)
			await this.sendProperties()
		}
	}

	handlePropertySet (propertyId, message) {
		const property = this.properties.get(propertyId)
		if (property && property.onSet) property.onSet(message)
	}

	async setPropertyValue (id, value, flush = false) {
		const property = this.properties.get(id)
		property.value = value
		property.changed = true

		if (flush) await this.flushChanges()
	}

	async setup () {
		this.setupCalled = true
		await this.publish('$name', this.name)
		await this.publish('$type', this.type)
		for (const id of this.properties.keys()) await this.setupProperty(id)
		this.sendProperties()
	}

	async sendProperties () {
		await this.publish('properties', Array.from(this.properties.keys()).join(','))
	}

	async setupProperty (id) {
		const property = this.properties.get(id)
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
	}

	async flushChanges () {
		for (const [id, property] of this.properties.entries()) {
			if (property.changed) {
				await this.publish(`${id}`, property.value, property.retained !== false)
				property.changed = false
			}
		}
	}

	async publish (topic, payload, retain = true) {
		await this.mqttClient.publish(`${this.baseTopic}/${topic}`, payload, {
			qos: 2,
			retain,
		})
	}
}

module.exports = DeviceNode
