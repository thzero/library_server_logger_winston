import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import '@thzero/library_common/utility/string.js';
import LoggerService from '../index.js';
import SyslogTransport from '../transports/syslog.js';

let service;
let logged;
let disabled;

beforeEach(() => {
	service = new LoggerService();
	logged = [];
	disabled = new Set();
	service._transports = [ {} ]; // every method short circuits on an empty transport list
	service._log = {
		isLevelEnabled: (level) => !disabled.has(level),
		log: (entry) => logged.push(entry)
	};
});

// winston's log() with one argument writes straight to the stream, and the
// level is only compared inside each transport, after the format pipeline has
// run. The wrapper asks first.
describe('level gate', () => {
	it('does not format or write for a level that is off', () => {
		let formats = 0;
		service._format = () => { formats++; return ''; };
		disabled.add('debug').add('trace');

		service.debug('C', 'm', 'msg', { big: true }, 'cid');
		service.debug2('msg', null, 'cid');
		service.trace('C', 'm', 'msg', null, 'cid');
		service.trace2('msg', null, 'cid');

		assert.equal(logged.length, 0);
		assert.equal(formats, 0);
	});

	it('still writes the levels that are on', () => {
		disabled.add('debug');
		service.debug('C', 'm', 'msg', null, 'cid');
		service.info('C', 'm', 'msg', null, 'cid');
		service.exception('C', 'm', new Error('boom'), 'cid');
		assert.deepEqual(logged.map(entry => entry.level), [ 'info', 'error' ]);
	});

	it('writes everything through a winston without the check', () => {
		delete service._log.isLevelEnabled;
		service.debug('C', 'm', 'msg', null, 'cid');
		assert.equal(logged.length, 1);
	});
});

// Regression: selecting syslog swaps in winston's syslog levels, which have no
// warn, fatal or trace. Every line at one of those made winston print "Unknown
// logger level" to stderr, synchronously, and drop the message. warn is on the
// 401 paths.
describe('with the syslog transport selected', () => {
	beforeEach(() => {
		service._transportConfig = new SyslogTransport();
	});

	it('maps the library levels onto the transport levels', () => {
		service.warn('C', 'm', 'msg', null, 'cid');
		service.fatal('C', 'm', 'msg', null, 'cid');
		service.trace('C', 'm', 'msg', null, 'cid');
		service.error('C', 'm', 'msg', null, 'cid');
		service.exception('C', 'm', new Error('boom'), 'cid');
		assert.deepEqual(logged.map(entry => entry.level), [ 'warning', 'emerg', 'debug', 'error', 'error' ]);
	});

	it('gates on the mapped level, which is the one winston knows', () => {
		disabled.add('warning');
		service.warn('C', 'm', 'msg', null, 'cid');
		assert.equal(logged.length, 0);
	});

	it('is remembered from initLogger', async () => {
		// A real winston logger is built here, so the transport has to be a real
		// one; a silent console transport writes nothing.
		service._transports = [];
		const transportConfig = service._transportConfigs[0];
		transportConfig.init = (winston) => ({ transport: new winston.transports.Console({ silent: true }), levels: winston.config.syslog.levels });
		await service.initLogger('info', false, { external: { type: 'syslog' } });
		assert.equal(service._transportConfig, transportConfig);
		assert.equal(service._log.isLevelEnabled('warning'), true);
		assert.equal(service._log.isLevelEnabled('warn'), false, 'the library name is not a syslog level');
	});
});

describe('_format', () => {
	it('leads with the correlationId', () => {
		assert.equal(service._format('Clazz', 'method', 'msg', 'cid'), '(cid) Clazz.method: msg');
	});

	it('omits the correlationId when there is none', () => {
		assert.equal(service._format('Clazz', 'method', 'msg', null), 'Clazz.method: msg');
	});

	it('drops the dot when only one of clazz and method is given', () => {
		assert.equal(service._format('Clazz', null, 'msg', null), 'Clazz: msg');
		assert.equal(service._format(null, 'method', 'msg', null), 'method: msg');
	});

	it('marks client-originated lines', () => {
		assert.equal(service._format(null, null, 'msg', null, true), 'CLIENT: msg');
	});
});

describe('transport guard', () => {
	it('logs nothing when no transport is configured', () => {
		service._transports = [];
		service.info('C', 'm', 'msg', null, 'cid');
		service.error('C', 'm', 'msg', null, 'cid');
		service.warn('C', 'm', 'msg', null, 'cid');
		assert.equal(logged.length, 0);
	});
});

describe('levels', () => {
	it('carry the level winston expects', () => {
		service.debug('C', 'm', 'msg', null, 'cid');
		service.error('C', 'm', 'msg', null, 'cid');
		service.fatal('C', 'm', 'msg', null, 'cid');
		service.info('C', 'm', 'msg', null, 'cid');
		service.trace('C', 'm', 'msg', null, 'cid');
		service.warn('C', 'm', 'msg', null, 'cid');
		assert.deepEqual(logged.map(entry => entry.level), [ 'debug', 'error', 'fatal', 'info', 'trace', 'warn' ]);
	});

	it('format the message the same way for every level', () => {
		service.info('C', 'm', 'msg', null, 'cid');
		assert.equal(logged[0].message, '(cid) C.m: msg');
	});

	it('the 2 variants log without a clazz or method', () => {
		service.warn2('msg', null, 'cid');
		assert.equal(logged[0].message, '(cid) msg');
	});

	it('normalise undefined data to null', () => {
		service.info('C', 'm', 'msg', undefined, 'cid');
		assert.equal(logged[0].meta, null);
	});

	// Regression: warn and warn2 put the payload under `data` while the other ten
	// methods use `meta`, so anything reading meta saw nothing for warnings.
	it('carry data under meta, warnings included', () => {
		service.info('C', 'm', 'msg', { a: 1 }, 'cid');
		service.warn('C', 'm', 'msg', { a: 1 }, 'cid');
		service.warn2('msg', { a: 1 }, 'cid');
		for (const entry of logged)
			assert.deepEqual(entry.meta, { a: 1 }, `${entry.level} must use meta`);
	});
});

describe('exception', () => {
	it('logs the exception message at error level', () => {
		service.exception('C', 'm', new Error('boom'), 'cid');
		assert.equal(logged[0].level, 'error');
		assert.equal(logged[0].message, 'boom');
	});

	it('marks a client exception', () => {
		service.exception2(new Error('boom'), 'cid', true);
		assert.equal(logged[0].message, 'CLIENT: boom');
	});
});

describe('syslog transport', () => {
	const transport = new SyslogTransport();

	it('is identified as syslog', () => {
		assert.equal(transport.type, 'syslog');
	});

	// Regression: these comparisons were == rather than ===.
	it('maps the library levels onto syslog levels', () => {
		assert.equal(transport.convertLevel('debug'), 'debug');
		assert.equal(transport.convertLevel('error'), 'error');
		assert.equal(transport.convertLevel('fatal'), 'emerg');
		assert.equal(transport.convertLevel('info'), 'info');
		assert.equal(transport.convertLevel('trace'), 'debug');
		assert.equal(transport.convertLevel('warn'), 'warning');
	});

	it('returns null for a level it does not know', () => {
		assert.equal(transport.convertLevel('nonsense'), null);
		assert.equal(transport.convertLevel(null), null);
	});

	// Regression: init added a configured Syslog to winston's default logger,
	// which nothing writes to, and returned a second one built without the
	// options. That was an extra socket, and the one in use ignored the config.
	it('builds one transport, with the options, and leaves the default logger alone', () => {
		let added = 0;
		const winston = { add() { added++; }, config: { syslog: { levels: { emerg: 0, warning: 4, debug: 7 } } } };
		const results = transport.init(winston, { options: { protocol: 'udp4', port: 5140 } });
		assert.equal(added, 0);
		assert.equal(results.transport.port, 5140);
		assert.equal(results.levels, winston.config.syslog.levels);
	});
});
