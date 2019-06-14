const winston = require('winston')

function createLogger (config) {
	const logger = winston.createLogger({
		level: config.logger.level || 'info',
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.timestamp(),
			winston.format.simple(),
		),
		transports: [
			new winston.transports.Console(),
		],
	})

	return logger
}

module.exports = createLogger;
