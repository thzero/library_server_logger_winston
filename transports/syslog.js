require('@thzero/winston-syslog').Syslog;

class SyslogTransport {
	init(winston, config) {
		const options = config.options || {
			protocol: 'udp4'
		};
		winston.add(new winston.transports.Syslog(options));

		const transport = new winston.transports.Syslog();
		return { transport: transport, levels: winston.config.syslog.levels };
	}

	convertLevel(logLevel) {
		if (logLevel == 'debug')
			return 'debug';
		if (logLevel == 'error')
			return 'error';
		if (logLevel == 'fatal')
			return 'emerg';
		if (logLevel == 'info')
			return 'info';
		if (logLevel == 'trace')
			return 'debug';
		if (logLevel == 'warn')
			return 'warning';

		return null;
	}

	get type() { return 'syslog'; }
}

export default SyslogTransport;
