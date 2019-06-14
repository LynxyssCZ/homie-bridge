const XiaomiServiceReader = require('xiaomi-gap-parser');

class XiaomiGAPParser {
	constructor () {
		this.type = 'MJ_HT_V1'
	}

	match (source, deviceId, payload) {
		if (source !== 'BLE-GAP') return false
		const {advertisedData, localName} = payload
		if (localName !== 'MJ_HT_V1') return false
		if (advertisedData && advertisedData.hasOwnProperty('fe95')) return true
		return false
	}

	async parse (source, deviceId, payload) {
		const data = XiaomiServiceReader.readServiceData(payload.advertisedData['fe95'])

		return {
			id: `${deviceId}`,
			metaData: {
				frameControl: data.frameControl,
				eventID: data.eventID,
			},
			data: {
				rssi: payload.rssi,
				...data.event.data,
			},
		}
	}
}

module.exports = XiaomiGAPParser
