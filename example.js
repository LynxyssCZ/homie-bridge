const noble = require('noble');
const XiaomiServiceReader = require('xiaomi-gap-parser');

noble.on('stateChange', function(state) {
	if (state === 'poweredOn') {
		noble.startScanning([], true);
	} else {
		noble.stopScanning();
	}
});

noble.on('discover', function(peripheral) {
	const {advertisement, id, rssi, address} = peripheral;
	const {localName, serviceData, serviceUuids} = advertisement;
	let xiaomiData = null;
	for (const data of serviceData) {
		if (data.uuid.toString('hex') === 'fe95') {
			console.log(serviceUuids, data)
			xiaomiData = data.data;
		}
	}

	if (!xiaomiData) return;

	console.log({
		id, address, localName, rssi,
		data: JSON.stringify(XiaomiServiceReader.readServiceData(xiaomiData)),
	})
});
