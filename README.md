![GitHub package.json version](https://img.shields.io/github/package-json/v/thzero/library_server_logger_winston)
![David](https://img.shields.io/david/thzero/library_server_logger_winston)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# library_server_logger_winston

A [winston](https://github.com/winstonjs/winston) backed logger for [@thzero/library_server](https://github.com/thzero/library_server), with optional syslog forwarding.

Registers as one of the logger services the framework fans out to, so an application can run winston alone or alongside another logger (pino) without changing any calling code.

## Requirements

### NodeJs

[NodeJs](https://nodejs.org) version 22+

### Installation

[![NPM](https://nodei.co/npm/@thzero/library_server_logger_winston.png?compact=true)](https://npmjs.org/package/@thzero/library_server_logger_winston)

```
npm install @thzero/library_server_logger_winston
```

#### Peer dependencies

* `@thzero/library_common`
* `@thzero/library_common_service`
* `@thzero/library_server`

## What it provides

`index.js` — default export `LoggerService`, implementing the logger contract the framework calls:

| Method | Signature |
|---|---|
| `debug` / `error` / `fatal` / `info` / `trace` / `warn` | `(clazz, method, message, data, correlationId, isClient)` |
| `debug2` / `error2` / `fatal2` / `info2` / `trace2` / `warn2` | `(message, data, correlationId, isClient)` |
| `exception` | `(clazz, method, ex, correlationId, isClient)` |
| `exception2` | `(ex, correlationId, isClient)` |
| `initLogger` | `(logLevel, prettify, configLogging, transports)` |

Every method short circuits and logs nothing when no transport is configured, so an unconfigured logger is silent rather than an error. The payload goes to winston under `meta`, and the message is formatted with the correlationId first:

```
(sNC7TWVZY9ChN1wQk6qqW) MongoRepository._initializeDb: databaseName resolved
```

An `isClient` of `true` prefixes the message with `CLIENT: `.

`transports/syslog.js` — default export `SyslogTransport`. Wraps `@thzero/winston-syslog` and maps the library's levels onto syslog's:

| library | syslog |
|---|---|
| `debug` | `debug` |
| `error` | `error` |
| `fatal` | `emerg` |
| `info` | `info` |
| `trace` | `debug` |
| `warn` | `warning` |

Anything else maps to `null`.

### Levels

Unlike pino, this package declares its own level set, ordered most to least severe:

```
off (0), fatal (1), error (2), warn (3), info (4), debug (5), trace (6), all
```

When a syslog transport is active it replaces these with `winston.config.syslog.levels`, and the configured level is translated through `convertLevel`.

## Configuration

`initLogger` is called for you during boot from the `logging` block.

```json
{
    "app": {
        "logging": {
            "level": "debug",
            "prettify": false,
            "external": {
                "console": true,
                "type": "syslog",
                "options": {
                    "protocol": "udp4",
                    "host": "127.0.0.1",
                    "port": 514
                }
            }
        }
    }
}
```

* **`level`** — overridden by the `LOG_LEVEL` environment variable.
* **`external.console`** — adds a `winston.transports.Console` fixed at `info`.
* **`external.type`** — matched against each registered transport's `type`. Only `syslog` ships with this package. A type that matches nothing is silently ignored; a type that matches but fails to build throws `Invalid transport '<type>'`.
* **`external.options`** — passed straight to the transport. The syslog transport defaults to `{ protocol: 'udp4' }` when omitted.

**With no `external` block at all, `configLoggingExternal` defaults to `{ console: false }` — no transports, so nothing is logged.** Set `external.console` to `true` for local development.

## Wiring it up

Register it from `_initServicesLoggers` in your `BootMain` derived class:

```js
import winstonLoggerService from '@thzero/library_server_logger_winston/index.js';

class AppBootMain extends BootMain {
    _initServicesLoggers() {
        this._registerServicesLogger(AppConstants.InjectorKeys.SERVICE_LOGGER_WINSTON, new winstonLoggerService());
    }
}
```

To add a transport this package does not ship, push a configured winston transport through the fourth `initLogger` argument, or subclass and add to `this._transportConfigs` in the constructor — an entry needs `type`, `init(winston, config, logLevel)` and `convertLevel(logLevel)`.

## Development

```
npm run lint       # eslint .
npm run lint:fix   # eslint . --fix
npm test           # node --test "test/*.test.js"
```
