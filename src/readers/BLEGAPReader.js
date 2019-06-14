const noble = require('noble')
const BaseReader = require('./BaseReader')

class BleReader extends BaseReader {
	constructor (config, logger) {
		super(config, logger, 'BLE-GAP')
		this.onDiscover = this.onDiscover.bind(this)
	}

	onDiscover (peripheral) {
		const {advertisement, id, rssi, address} = peripheral;
		const {localName, serviceData, serviceUuids} = advertisement;
		const advertisedData = {}

		for (const service of serviceData) {
			advertisedData[service.uuid.toString('hex')] = service.data
		}

		this.handleMessage(address, {
			id, rssi, address, localName, serviceUuids, advertisedData,
		})
	}

	async init () {
		noble.on('discover', this.onDiscover)
		return new Promise((resolve, reject) => {
			noble.once('stateChange', (state) => {
				if (state === 'poweredOn') resolve()
				else reject(state)
			})
		})
	}

	async start () {
		noble.startScanning([], true)
	}

	async stop () {
		noble.stopScanning()
	}
}

module.exports = BleReader
