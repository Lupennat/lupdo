<p align="center">
	<a href="https://www.npmjs.com/package/lupdo" target="__blank"><img src="https://img.shields.io/npm/v/lupdo?color=0476bc&label=" alt="NPM version"></a>
	<a href="https://www.npmjs.com/package/lupdo" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/lupdo?color=3890aa&label="></a>
<a href="https://codecov.io/github/Lupennat/lupdo" >
<img src="https://codecov.io/github/Lupennat/lupdo/branch/main/graph/badge.svg?token=FOECLCWQ7F"/>
</a>
</p>

# Lupdo

Lupdo is an abstraction layer used for accessing databases, similar to PHP Data Objects exposes a set of APIs.\
Lupdo is not an ORM, Lupdo aims to be a stable layer through which to build an ORM or a Query Builder.\
Lupdo create a Pool of connection By Default.
Lupdo offers the possibility of creating drivers for any database that accepts sql like syntax.

-   [Third Party Library](#third-party-library)
-   [Available Drivers](#available-drivers)
-   [Usage](#usage)
-   [Pdo](#pdo)
    -   [Constants & Attributes](#pdo-constants--attributes)
    -   [Raw Pool Connection](#pdo-raw-pool-connection)
-   [Pool Options](#pool-options)
-   [Transaction](#transaction)
-   [Statement](#statement)
    -   [Fetched Object](#fetched-object)
    -   [Fetch Examples](FETCH.md)
-   [Prepared Statement](#prepared-statement)
    -   [Valid Bindings](#valid-bindings)
    -   [Params](#params)
-   [Logger](#logger)
-   [Debug](#debug)

## Third Party Library

Lupdo, under the hood, uses stable and performant npm packages:

-   [tarn.js](https://github.com/vincit/tarn.js)

## Available Drivers

-   [lupdo-mysql](https://www.npmjs.com/package/lupdo-mysql)
-   [lupdo-sqlite](https://www.npmjs.com/package/lupdo-sqlite)

> **Note**
> A Short Doc [How To Write A Driver](DRIVER.md)

## Usage

Base Example

```js
const Pdo = require('lupdo');
// ES6 or Typescrypt
import Pdo from 'lupdo';

const pdo = new Pdo('sqlite', { path: ':memory' }, { min: 2, max: 3 });
const run = async () => {
    const statement = await pdo.query('SELECT 2');
    const res = statement.fetchArray().all();
    console.log(res);
    await pdo.disconnect();
};

run();
```

## Pdo

-   constructor(driver: [string](#available-drivers), driverOptions: [DriverOptions](#driver-options),PoolOptions: [PoolOptions](#pool-options), attributes: [PdoAttributes](#pdo-constants--attributes))
-   setLogger(logger: [PdoLogger](#logger)): void
-   getAvailableDrivers(): [string[]](#available-drivers)
-   addDriver(driverName: string, driver: [PdoDriverConstructor](DRIVER.md)): void
-   prototype.beginTransaction() :Promise<[PdoTransactionI](#transaction)>
-   prototype.exec(sql: string): Promise<number>
-   prototype.prepare(sql: string): Promise<[PdoPreparedStatementI](#prepared-statement)>
-   prototype.query(sql: string): Promise<[PdoStatementI](#statement)>
-   prototype.getAttribute([attribute](#pdo-attributes): string): string | number;
-   prototype.setAttribute([attribute](#pdo-attributes): string, value: number | string): boolean;
-   prototype.disconnect(): Promise<void>
-   prototype.reconnect(): void
-   prototype.getRawPoolConnection(): Promise<[RawPoolConnection](#pdo-raw-pool-connection)>

### Pdo Constants & Attributes

-   `ATTR_DEBUG` Determines if DEBUG mode is enabled. Can take one of the following values: [Default DEBUG_DISABLED]
    -   `DEBUG_DISABLED` Disable DEBUG mode
    -   `DEBUG_ENABLED` Enable DEBUG mode
-   `ATTR_CASE` Force column names to a specific case. Can take one of the following values: [Default CASE_NATURAL]
    -   `CASE_NATURAL` Leave column names as returned by the database driver.
    -   `CASE_LOWER` Force column names to upper case.
    -   `CASE_UPPER` Force column names to lower case.
-   `ATTR_NULLS` Determines if and how null and empty strings should be converted. Can take one of the following values: [Default NULL_NATURAL]
    -   `NULL_NATURAL` No conversion takes place.
    -   `NULL_EMPTY_STRING` Empty strings get converted to null.
    -   `NULL_TO_STRING` null gets converted to an empty string.
-   `ATTR_FETCH_DIRECTION` Determines which direction Fetch retrieve data. Can take one of the following values: [Default FETCH_FORWARD]
    -   `FETCH_FORWARD` Fetch the next row in the result set.
    -   `FETCH_BACKWARD` Fetch the previous row in the result set.
-   `ATTR_DRIVER_NAME` Returns the name of the driver.

### Pdo Raw Pool Connection

Lupdo offers the possibility of retrieving a raw connection from the pool, to perform any unexposed operations.\
The connection returned is the original [Driver Connection](#available-drivers) used behind the scenes by Lupdo.

> **Warning**
> Once the connection has been used, the connection must be released, otherwise the pool will not be able to disconnect.

## Driver Options

Each driver uses the connection options of the corresponding npm package.\
Debug mode, is defined through Pdo Attributes, custom debug connection options, will be ignored.

## Pool Options

-   `min` minimum pool size [Default = 2].
-   `max` maximum pool size [Default = 10].
-   `acquireTimeoutMillis` acquire promises are rejected after this many milliseconds if a resource cannot be acquired [Default 10000].
-   `createTimeoutMillis` create operations are cancelled after this many milliseconds if a resource cannot be acquired [Default 5000].
-   `destroyTimeoutMillis` destroy operations are awaited for at most this many milliseconds new resources will be created after this timeout [Default 5000].
-   `killTimeoutMillis` when pool destroy is executed, connection will be released and brutaly killed after this timeut [Default 10000].
-   `killResource` enable/disable killTimeout [Default false].
-   `idleTimeoutMillis` Free resources are destroyed after this many milliseconds. Note that if min > 0, some resources may be kept alive for longer. To reliably destroy all idle resources, set min to 0 [Default 30000].
-   `createRetryIntervalMillis` how long to idle after failed create before trying again [Default 200].
-   `reapIntervalMillis` how often to check for idle resources to destroy [Default 500].
-   `created` Define Custom Created Callback.
-   `destroyed` Define Custom Destroyed Callback.
-   `acquired` Define Custom Acquired Callback.
-   `released` Define Custom Release Callback.
-   `killed` Define Custom Kill Callback.

> **Warning**
> property `killResource` should always be false, before activating this option, verify that you have committed or rolled back all transactions and verified that you have closed all prepared statments
> When 'beginTransaction()' is called connection will be released to the pool only after 'commit()' or 'rollback()' is called.
> When 'prepare()' is called, connection will be released to the pool only after 'close()' is called.
> killResource might not be supported by all drivers

> **Warning**
> callback `created` should be used only to set session variables on the connection before it gets used.

```js
{
    created: async (uuid, connection) => {
        await connection.query('SET SESSION auto_increment_increment=1');
    };
}
```

## Transaction

-   prototype.commit(): Promise<void>;
-   prototype.rollback(): Promise<void>;
-   prototype.exec(sql: string): Promise<number>
-   prototype.prepare(sql: string): Promise<[PdoTransactionPreparedStatementI](#prepared-statement)>
-   prototype.query(sql: string): Promise<[PdoStatement](#statement)>
-   prototype.disconnect(): Promise<void>

## Statement

-   prototype.getAttribute([attribute](#pdo-attributes): string): string | number;
-   prototype.setAttribute([attribute](#pdo-attributes): string, value: number | string): boolean;
-   prototype.columnCount(): number;
-   prototype.debug(): string;
-   prototype.fetchDictionary(): [Fetched](#fetched-object)<Dictionary>;
-   prototype.fetchArray(): [Fetched](#fetched-object)<PdoColumnValue[]>;
-   prototype.fetchBoth(): [Fetched](#fetched-object)<Both>;
-   prototype.fetchColumn<T extends PdoColumnValue>(column: number): [Fetched](#fetched-object)<T>;
-   prototype.fetchObject<T>(abstract: Newable<T>, constructorArgs?: any[]): [Fetched](#fetched-object)<T>;
-   prototype.fetchClosure<T>(fn: (...args: PdoColumnValue[]) => T): [Fetched](#fetched-object)<T>;
-   prototype.fecthNamed(): [Fetched](#fetched-object)<Named>;
-   prototype.fetchPair<T extends PdoColumnValue, U extends PdoColumnValue>(): Pair<T, U>;
-   prototype.resetCursor(): void;
-   prototype.getColumnMeta(column: number): ColumnData | null;
-   prototype.rowCount(): number;
-   prototype.lastInsertId(): string | bigint | number | null;

### Fetched Object

-   get: () => T | undefined;
-   all: () => T[];
-   group: () => Group<T>;
-   unique: () => Unique<T>;

> **Note**
> Fetched Object is an Iterable Object. [Here](FETCH.md) you can find a more comprehensive guide.

## Prepared Statement

extends [Statement](#statement)

-   prototype.bindValue(key: string | number, value: [ValidBindings](#valid-bindings)): void;
-   prototype.execute(params?: [Params](#params)): Promise<void>;
-   prototype.close(): Promise<void>

> **Warning**
> Prepared Statement do not release the connection automatically to take advantage of cached statement. You must close manually the connection through `close()` method when you finish `execute()` sequences.
> Prepared Statement inside a transaction doesn't expose `close()` method, connection will be release only on `commit()` or `rollback()`

### Valid Bindings

-   number
-   string
-   bigint
-   Buffer
-   Date
-   boolean

### Params

Array of [ValidBindings](#valid-bindings)\
or a key-value object

## Logger

Lupdo by default doesn't log anything, you can assign a custom log for Lupdo to intercept messages.

```js
const Pdo = require('lupdo');
// ES6 or Typescrypt
import Pdo from 'lupdo';
Pdo.setLogger((message: any, level?: any) => {
    console.log(message, level);
});
```

## Debug

If you are running into problems, one thing that may help is enabling the debug mode for the connection.\
You can enable debug using [ATTR_DEBUG](#pdo-constants--attributes).\
This will print extra information on stdout.
