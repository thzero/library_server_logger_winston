import winston from 'winston';

import SyslogTransprt from './transports/syslog';

import Service from '@thzero/library_server/service/index';

const CLIENT_PREFIX = 'CLIENT: ';

class LoggerService extends Service {
	constructor() {
		super();

		this._transports = [];
		this._transportConfigs = [];

		this._transportConfigs.push(new SyslogTransprt());
	}

	async initLogger(logLevel, prettify, configLogging, transports) {
		if (transports && Array.isArray(transports)) {
			for (const transport of transports)
				this._transports.push(transport);
		}

		let levels = {
			levels: {
				off: 0,
				fatal: 1,
				error: 2,
				warn: 3,
				info: 4,
				debug: 5,
				trace: 6,
				all: Number.MAX_VALUE
			},
			colors: {
				fatal: 'red',
				error: 'red',
				warn: 'yellow',
				info: 'green',
				debug: 'blue',
				trace: 'cyan'
			}
		};

		let configLoggingExternal = configLogging.external || {
			console: false
		};
		if (configLoggingExternal) {
			for (const transportConfig of this._transportConfigs) {
				if (configLoggingExternal.type !== transportConfig.type)
					continue;

				const results = transportConfig.init(winston, configLoggingExternal, logLevel);
				if (!results)
					throw Error(`Invalid transport '${configLoggingExternal.type}'.`);

				this._transports.push(results.transport);
				levels = results.levels;
				logLevel = transportConfig.convertLevel(logLevel);
			}
		}

		if (configLoggingExternal.console)
			this._transports.push(new winston.transports.Console({ level: 'info' }));

		this._log = winston.createLogger({
			level: logLevel,
			levels: levels,
			transports: this._transports
		});
	}

	_message(message, isClient) {
		return (isClient ? CLIENT_PREFIX : '') + message;
	}

	debug(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'debug',
			message: this._message(message, isClient),
			meta: data
		});
	}

	error(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'error',
			message: this._message(message, isClient),
			meta: data
		});
	}

	exception(ex, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		ex = (ex === undefined ? null : ex);
		this._log.log({
			level: 'error',
			message: ((isClient ? CLIENT_PREFIX : '') + ex.message),
			data: ex
		});
	}

	fatal(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'fatal',
			message: this._message(message, isClient),
			meta: data
		});
	}

	info(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'info',
			message: this._message(message, isClient),
			meta: data
		});
	}

	trace(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'trace',
			message: this._message(message, isClient),
			meta: data
		});
	}

	warn(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'warn',
			message: this._message(message, isClient),
			data
		});
	}
}

export default LoggerService;
