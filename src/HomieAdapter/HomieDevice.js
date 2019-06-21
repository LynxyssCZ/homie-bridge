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
		switch (topic) {
			default:
				this.logger.info({payload: {topic, message}})
				break;
		}
	}

	async init () {
		await this.setup()
	}

	async onConnected () {
		await this.publish('$homie', '4')
		await this.publish('$name', this.name)
		await this.publish('$state', 'ready')
		await this.publish('$extensions', '')
		await this.setupNodes()
	}

	async setup () {
		this.mqttClient.on('reconnect', () => this.onConnected().catch(() => {}))
		if (this.mqttClient.connected) {
			await this.onConnected()
		} else {
			this.mqttClient.ocen('connect', () => this.onConnected().catch(() => {}))
		}
		
	}

	async setupNodes () {
		const nodes = []
		for (const [nodeId, node] of this.nodes.entries()) {
			await node.setup()
			nodes.push(nodeId)
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
