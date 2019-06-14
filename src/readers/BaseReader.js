const {EventEmitter} = require('events')

class BaseReader extends EventEmitter {
	constructor (config, logger, type) {
		super()
		this.config = config
		this.logger = logger
		this.type = type
	}

	async handleMessage (deviceId, payload) {
		this.emit('message', {source: this.type, deviceId, payload})
	}

	async init () {}
	async start () {}
	async stop() {}
}

module.exports = BaseReader
