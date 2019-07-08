const HomieNode = require('./HomieNode')

const DEFAULT_FLUSH_INTERVAL = 5 * 1000

class FlushTimer {
	constructor (interval, handler) {
		this.interval = interval
		this.timerId = null
		this.handler = handler
		this.flush = this.flush.bind(this)
	}

	stop () {
		clearInterval(this.timerId)
		this.timerId = null
	}

	start () {
		clearInterval(this.timerId)
		this.timerId = setInterval(this.flush, this.interval)
	}

	async flush () {
		this.stop()
		try {
			await this.handler()
		} finally {
			this.start()
		}
	}
}

class HomieDevice {
	constructor (mqttClient, baseTopic, id, name, flushInterval = DEFAULT_FLUSH_INTERVAL) {
		this.mqttClient = mqttClient
		this.id = id
		this.name = name
		this.nodes = new Map()
		this.baseTopic = `${baseTopic}/${id}`
		this.setupCalled = false
		this.flushTimer = new FlushTimer(flushInterval, this.flushChanges.bind(this))
	}

	async addNode (id, name, type, properties) {
		const node = new HomieNode(this.mqttClient, this.baseTopic, id, name, type, properties)
		this.nodes.set(id, node)

		if (this.setupCalled && this.mqttClient.connected) {
			await this.sendNodes()
			await node.setup()
		}
	}

	getNode (id) {
		return this.nodes.get(id)
	}

	async handleMessage (topic, message) {
		if (topic.startsWith(this.baseTopic) && topic.endsWith('/set')) {
			const [nodeId, property] = topic.replace(this.baseTopic + '/', '').replace('/set', '').split('/')
			const node = this.getNode(nodeId)
			if (node) await node.handlePropertySet(property, message)
		}
	}

	async init () {
		await this.setup()
	}

	async stop () {
		await this.flushTimer.flush()
		this.flushTimer.stop()
		await this.publish('$state', 'disconnected')
	}

	async onConnected () {
		await this.sendDeviceInfo()
		await this.mqttClient.subscribe(`${this.baseTopic}/+/+/set`)
		await this.flushTimer.flush()
	}

	async setup () {
		this.setupCalled = true
		this.mqttClient.on('offline', () => this.flushTimer.stop())
		this.mqttClient.on('message', this.handleMessage.bind(this))
		this.mqttClient.on('connect', () => this.onConnected().catch(() => {}))
		if (this.mqttClient.connected) await this.onConnected()
	}

	async sendDeviceInfo () {
		await this.publish('$homie', '4')
		await this.publish('$name', this.name)
		await this.publish('$state', 'ready')
		await this.publish('$extensions', '')
		await this.sendNodes()
		for (const node of this.nodes.values()) await node.setup()
	}

	async sendNodes () {
		await this.publish('$nodes', Array.from(this.nodes.keys()).join(','))
	}

	async flushChanges () {
		for (const node of this.nodes.values()) await node.flushChanges()
	}

	async publish (topic, payload, retain = true) {
		await this.mqttClient.publish(`${this.baseTopic}/${topic}`, payload, {
			qos: 2,
			retain,
		})
	}
}

module.exports = HomieDevice
