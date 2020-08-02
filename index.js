import winston from 'winston';

import Service from '@thzero/library_server/service/index';

const CLIENT_PREFIX = 'CLIENT: ';

class LoggerService extends Service {
	async initLogger(logLevel, prettify, config) {
		this._log = winston.createLogger({
			transports: [
			  //
			  // - Write all logs with level `error` and below to `error.log`
			  // - Write all logs with level `info` and below to `combined.log`
			  //
			  new winston.transports.File({ filename: 'error.log', level: 'error' }),
			  new winston.transports.File({ filename: 'combined.log' }),
			],
		});
	}

	_message(message, isClient) {
		return (isClient ? CLIENT_PREFIX : '') + message;
	}

	debug(message, data, isClient) {
		data = (data === undefined ? null : data);
		logger.log({
			level: 'debug',
			message: this._message(message, isClient),
			data
		});
	}

	error(message, data, isClient) {
		data = (data === undefined ? null : data);
		logger.log({
			level: 'error',
			message: this._message(message, isClient),
			data
		});
	}

	exception(ex, isClient) {
		ex = (ex === undefined ? null : ex);
		logger.log({
			level: 'crit',
			message: this._message(message, isClient),
			(isClient ? CLIENT_PREFIX : '') + ex
		});
	}

	fatal(message, data, isClient) {
		data = (data === undefined ? null : data);
		logger.log({
			level: 'emerg',
			message: this._message(message, isClient),
			data
		});
	}

	info(message, data, isClient) {
		data = (data === undefined ? null : data);
		logger.log({
			level: 'info',
			message: this._message(message, isClient),
			data
		});
	}

	trace(message, data, isClient) {
		data = (data === undefined ? null : data);
		logger.log({
			level: 'debug',
			message: this._message(message, isClient),
			data
		});
	}

	warn(message, data, isClient) {
		data = (data === undefined ? null : data);
		logger.log({
			level: 'warning',
			message: this._message(message, isClient),
			data
		});
	}
}

export default LoggerService;
