const fs = require('fs')
const path = require('path')
const {promisify} = require('util')

class SensorReader {
	constructor (config, logger) {
		this.config = config
		this.logger = logger
		this.readers = []
		this.handler = null
		this.onMessage = this.onMessage.bind(this)
	}

	consume (handler) {
		this.handler = handler
	}

	onMessage (message) {
		if (this.handler) this.handler(message)
	}

	async init () {
		// Load all the readers
		const files = await promisify(fs.readdir)(path.resolve(__dirname, 'readers'))

		for (const fileName of files) {
			if (path.extname(fileName) !== '.js') continue
			if (fileName === 'BaseReader.js') continue
			try {
				const Reader = require(path.resolve(__dirname, 'readers', fileName))
				const reader = new  Reader(this.config, this.logger)
				await reader.init()
				reader.on('message', this.onMessage)
				this.readers.push(reader)
			} catch (err) {
				this.logger.error({
					path: 'SensorReader',
					message: 'Initialization of reader failed',
					payload: {fileName, err},
				})
			}
		}
	}

	async start () {
		for (const reader of this.readers) await reader.start()
	}

	async stop () {
		for (const reader of this.readers) await reader.stop()
	}
}

module.exports = SensorReader
