function MJ_HT_V1 ({id, data}) {
	const updates = []

	if (data.tmp) updates.push({ property: 'tmp', value: data.tmp.toFixed(1) })
	if (data.hum) updates.push({ property: 'hum', value: data.hum.toFixed(1) })
	if (data.bat) updates.push({ property: 'bat', value: `${data.bat}` })
	if (data.rssi) updates.push({ property: 'rssi', value: `${data.rssi}` })
	updates.push({ property: 'ls', value: (new Date()).toISOString() })

	return {
		nodeId: `mj-ht-v1-${id.replace(/:/g, '').toLowerCase()}`,
		updates,
	}
}

module.exports = {
	MJ_HT_V1,
}
