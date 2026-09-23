import winston from 'winston';

import SyslogTransprt from './transports/syslog.js';

import Service from '@thzero/library_server/service/index.js';

const CLIENT_PREFIX = 'CLIENT: ';

class LoggerService extends Service {
	constructor() {
		super();

		this._transports = [];
		this._transportConfigs = [];
		// The external transport that was selected, if any. Its level names replace
		// the library's, so every call has to be mapped through it.
		this._transportConfig = null;

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
				this._transportConfig = transportConfig;
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

	debug(clazz, method, message, data, correlationId, isClient) {
		const level = this._level('debug');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(clazz, method, message, correlationId, isClient),
			meta: data
		});
	}

	debug2(message, data, correlationId, isClient) {
		const level = this._level('debug');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(null, null, message, correlationId, isClient),
			meta: data
		});
	}

	error(clazz, method, message, data, correlationId, isClient) {
		const level = this._level('error');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(clazz, method, message, correlationId, isClient),
			meta: data
		});
	}

	error2(message, data, correlationId, isClient) {
		const level = this._level('error');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(null, null, message, correlationId, isClient),
			meta: data
		});
	}

	exception(clazz, method, ex, correlationId, isClient) {
		const level = this._level('error');
		if (!this._enabled(level))
			return;

		ex = (ex === undefined ? null : ex);
		this._log.log({
			level: level,
			message: ((isClient ? CLIENT_PREFIX : '') + ex.message),
			data: ex
		});
	}

	exception2(ex, correlationId, isClient) {
		const level = this._level('error');
		if (!this._enabled(level))
			return;

		ex = (ex === undefined ? null : ex);
		this._log.log({
			level: level,
			message: ((isClient ? CLIENT_PREFIX : '') + ex.message),
			data: ex
		});
	}

	fatal(clazz, method, message, data, correlationId, isClient) {
		const level = this._level('fatal');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(clazz, method, message, correlationId, isClient),
			meta: data
		});
	}

	fatal2(message, data, correlationId, isClient) {
		const level = this._level('fatal');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(null, null, message, correlationId, isClient),
			meta: data
		});
	}

	info(clazz, method, message, data, correlationId, isClient) {
		const level = this._level('info');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(clazz, method, message, correlationId, isClient),
			meta: data
		});
	}

	info2(message, data, correlationId, isClient) {
		const level = this._level('info');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(null, null, message, correlationId, isClient),
			meta: data
		});
	}

	trace(clazz, method, message, data, correlationId, isClient) {
		const level = this._level('trace');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(clazz, method, message, correlationId, isClient),
			meta: data
		});
	}

	trace2(message, data, correlationId, isClient) {
		const level = this._level('trace');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(null, null, message, correlationId, isClient),
			meta: data
		});
	}

	warn(clazz, method, message, data, correlationId, isClient) {
		const level = this._level('warn');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(clazz, method, message, correlationId, isClient),
			meta: data
		});
	}

	warn2(message, data, correlationId, isClient) {
		const level = this._level('warn');
		if (!this._enabled(level))
			return;

		data = (data === undefined ? null : data);
		this._log.log({
			level: level,
			message: this._format(null, null, message, correlationId, isClient),
			meta: data
		});
	}

	// winston's log() with a single argument goes straight to the stream: the
	// format pipeline and every transport run before the level is compared. Ask
	// first, so a suppressed call costs one lookup and no _format. A logger
	// without the check (a stub) logs everything.
	_enabled(level) {
		if (!this._transports || (this._transports.length <= 0))
			return false;

		return !this._log.isLevelEnabled || this._log.isLevelEnabled(level);
	}

	_format(clazz, method, message, correlationId, isClient) {
		let output = '';
		if (!String.isNullOrEmpty(correlationId))
			output += `(${correlationId}) `;
		if (!String.isNullOrEmpty(clazz))
			output += clazz + (!String.isNullOrEmpty(method) ? '.' : '');
		if (!String.isNullOrEmpty(method))
			output += method;
		if (!String.isNullOrEmpty(clazz) || !String.isNullOrEmpty(method))
			output += ': ';
		output += (isClient ? CLIENT_PREFIX : '');
		if (!String.isNullOrEmpty(message))
			output += message;
		return output;
	}

	// An external transport brings its own level names. syslog has no warn,
	// fatal or trace; a line at one of those used to make winston write "Unknown
	// logger level" to stderr and drop the message.
	_level(level) {
		if (!this._transportConfig)
			return level;

		return this._transportConfig.convertLevel(level) ?? level;
	}
}

export default LoggerService;
