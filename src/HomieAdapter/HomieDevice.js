const HomieNode = require('./HomieNode')

class HomieDevice {
	constructor (mqttClient, baseTopic, id, name) {
		this.mqttClient = mqttClient
		this.id = id
		this.name = name
		this.nodes = new Map()
		this.baseTopic = `${baseTopic}/${id}`
	}

	addNode (id, name, type, properties) {
		const node = new HomieNode(this.mqttClient, this.baseTopic, id, name, type, properties)
		this.nodes.set(id, node)
		return node
	}

	getNode (id) {
		return this.nodes.get(id)
	}

	handleMessage (topic, message) {
		if (topic.startsWith(this.baseTopic) && topic.endsWith('/set')) {
			const [nodeId, property] = topic.replace(this.baseTopic + '/', '').replace('/set', '').split('/')
			const node = this.getNode(nodeId)
			if (node) node.handlePropertySet(property, message)
		}
	}

	async init () {
		await this.setup()
	}

	async onConnected () {
		await this.sendDeviceInfo()
		await this.sendNodes()
		await this.mqttClient.subscribe(`${this.baseTopic}/+/+/set`)
	}

	async setup () {
		this.mqttClient.on('reconnect', () => this.onConnected().catch(() => {}))
		this.mqttClient.on('message', this.handleMessage.bind(this))
		if (this.mqttClient.connected) {
			await this.onConnected()
		} else {
			this.mqttClient.once('connect', () => this.onConnected().catch(() => {}))
		}
	}

	async sendDeviceInfo () {
		await this.publish('$homie', '4')
		await this.publish('$name', this.name)
		await this.publish('$state', 'ready')
		await this.publish('$extensions', '')
		for (const node of this.nodes.values()) await node.setup()
	}

	async sendNodes () {
		const nodes = []
		for (const [nodeId, node] of this.nodes.entries()) {
			nodes.push(`${nodeId}${node.isRange ? '[]' : ''}`)
		}
		await this.publish('$nodes', nodes.join(','))
	}

	async publish (topic, payload, retain = true) {
		await this.mqttClient.publish(`${this.baseTopic}/${topic}`, payload, {
			qos: 2,
			retain,
		})
	}
}

module.exports = HomieDevice
