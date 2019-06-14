const fs = require('fs')
const path = require('path')
const {promisify} = require('util')

class SensorParser {
	constructor (config, logger) {
		this.config = config
		this.logger = logger
		this.parsers = []
	}

	async parse (message) {
		const {source, deviceId, payload} = message

		const parser = this.parsers.find(parser => parser.match(source, deviceId, payload))
		if (!parser) return null
		const {id, data} = await parser.parse(source, deviceId, payload)
		return {
			id,
			type: parser.type,
			data,
		}
	}

	async init () {
		// Load all the parsers
		const files = await promisify(fs.readdir)(path.resolve(__dirname, 'parsers'))

		for (const fileName of files) {
			if (path.extname(fileName) !== '.js') continue
			if (fileName === 'BaseReader.js') continue
			const Parser = require(path.resolve(__dirname, 'parsers', fileName))
			const parser = new  Parser(this.config, this.logger)
			this.parsers.push(parser)
		}
	}
}

module.exports = SensorParser
