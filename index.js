const Configstore = require('configstore');
const packageJson = require('./package.json');
const Bridge = require('./src/Bridge')
const settings = new Configstore(packageJson.name, {
	homieSensors: [],
})
const config = require('./config')
const logger = require('./logger')(config)

const bridge = new Bridge(config, settings, logger)

async function run () {
	await bridge.init()
	await bridge.start()
}

run().catch((err) => {
	logger.error({
		message: err,
	})
	process.exit(1)
})
