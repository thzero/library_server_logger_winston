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

	debug(clazz, method, message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'debug',
			message: this._format(clazz, method, message, isClient),
			meta: data
		});
	}

	debug2(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'debug',
			message: this._format(null, null, message, isClient),
			meta: data
		});
	}

	error(clazz, method, message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'error',
			message: this._format(clazz, method, message, isClient),
			meta: data
		});
	}

	error2(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'error',
			message: this._format(null, null, message, isClient),
			meta: data
		});
	}

	exception(clazz, method, ex, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		ex = (ex === undefined ? null : ex);
		this._log.log({
			level: 'error',
			message: ((isClient ? CLIENT_PREFIX : '') + ex.message),
			data: ex
		});
	}

	exception2(ex, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		ex = (ex === undefined ? null : ex);
		this._log.log({
			level: 'error',
			message: ((isClient ? CLIENT_PREFIX : '') + ex.message),
			data: ex
		});
	}

	fatal(clazz, method, message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'fatal',
			message: this._format(clazz, method, message, isClient),
			meta: data
		});
	}

	fatal2(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'fatal',
			message: this._format(null, null, message, isClient),
			meta: data
		});
	}

	info(clazz, method, message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'info',
			message: this._format(clazz, method, message, isClient),
			meta: data
		});
	}

	info2(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'info',
			message: this._format(null, null, message, isClient),
			meta: data
		});
	}

	trace(clazz, method, message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'trace',
			message: this._format(clazz, method, message, isClient),
			meta: data
		});
	}

	trace2(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'trace',
			message: this._format(null, null, message, isClient),
			meta: data
		});
	}

	warn(clazz, method, message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'warn',
			message: this._format(clazz, method, message, isClient),
			data
		});
	}

	warn2(message, data, isClient) {
		if (!this._transports || (this._transports.length <= 0))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: 'warn',
			message: this._format(null, null, message, isClient),
			data
		});
	}

	_format(clazz, method, message, isClient) {
		let output = clazz;
		if (!String.isNullOrEmpty(output))
			output += '.';
		output += method;
		if (!String.isNullOrEmpty(output))
			output += ': ';
		output += (isClient ? CLIENT_PREFIX : '') + message;
		return output;
	}
}

export default LoggerService;
