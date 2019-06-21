function MJ_HT_V1 ({id, name}) {
	return {
		id: `mj-ht-v1-${id.replace(/:/g, '').toLowerCase()}`,
		name: name,
		type: 'MJ_HT_V1',
		properties: {
			'tmp': {
				name: 'Temperature',
				datatype: 'float',
			},
			'hum': {
				name: 'Humidity',
				datatype: 'float',
			},
			'bat': {
				name: 'Battery level',
				datatype: 'float',
			},
			'rssi': {
				name: 'RSSI',
				datatype: 'integer',
			},
			'ls': {
				name: 'Last Seen',
				datatype: 'string',
			},
		}
	}
}

module.exports = {
	MJ_HT_V1,
}
