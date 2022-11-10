# Npdo

> Npdo is in Alpha Version

Npdo is an abstraction layer used for accessing databases, similar to PHP Data Objects exposes a set of APIs.\
Npdo is not an ORM, Npdo aims to be a stable layer through which to build an ORM or a Query Builder.\
Npdo create a Pool of connection By Default.

-   [Third Party Library](#third-party-library)
-   [Supported Databases](#supported-databases)
-   [Usage](#usage)
    -   [Fetch Modes](FETCH_MODES.md)
-   [Npdo](#npdo)
-   [Driver Options](#driver-options)
    -   [mysql/mariadb](#mysql-options)
    -   [sqlite/sqlite3](#sqlite-options)
-   [Pool Options](#pool-options)
-   [Connection](#connection)
-   [Transaction](#transaction)
-   [Statement](#statement)
-   [Prepared Statement](#prepared-statement)
-   [Logger](#logger)
-   [Debug](#debug)

## Third Party Library

Npdo, under the hood, uses stable and performant npm packages:

-   [mysql2](https://github.com/sidorares/node-mysql2)
-   [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
-   [tarn.js](https://github.com/vincit/tarn.js)

## Supported Databases

Npdo support:

-   [mysql](https://www.mysql.com/)
-   [mariadb](https://mariadb.org/)
-   [sqlite/sqlite3](https://www.sqlite.org/index.html)

## Usage

Base Example

```js
const Npdo = require('npdo');
// ES6 or Typescrypt
import Npdo from 'npdo';
// get types from 'npdo/types'
import { NpdoStatement } from 'npdo/types';

const npdo = new Npdo('sqlite', { path: ':memory' }, { min: 2, max: 3 });
const run = async () => {
    const statement = await npdo.query('SELECT 2');
    const res = statement.fetchAll();
    console.log(res);
    await npdo.disconnect();
};

run();
```

## Npdo

-   constructor(driver: [NpdoAvailableDriver[]](#supported-databases), driverOptions: [NpdoDriver.Options](#driver-options), NpdoPoolOptions: [PoolOptions](#pool-options))
-   setLogger(logger: [NpdoLogger](#logger)): void
-   getAvailableDrivers(): [NpdoAvailableDriver[]](#supported-databases)
-   prototype.beginTransaction() :Promise<[NpdoTransaction](#transaction)>
-   prototype.exec(sql: string): Promise<number>
-   prototype.prepare(sql: string): Promise<[NpdoPreparedStatement](#prepared-statement)>
-   prototype.query(sql: string, fetchMode?: number, columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]): Promise<[NpdoStatement](#statement)>
-   prototype.disconnect(): Promise<void>

### Npdo Constants

-   `FETCH_ASSOC` Specifies that the fetch method shall return each row as a key-value object keyed by column name as returned in the corresponding result set. If the result set contains multiple columns with the same name, Npdo::FETCH_ASSOC returns only a single value per column name.
-   `FETCH_NUM` Specifies that the fetch method shall return each row as an array indexed by column number as returned in the corresponding result set, starting at column 0.
-   `FETCH_BOTH` Specifies that the fetch method shall return each row as a key-value object keyed by both column name and number as returned in the corresponding result set, starting at column 0.
-   `FETCH_COLUMN` Specifies that the fetch method shall return only a single requested column from the next row in the result set.
-   `FETCH_CLASS` Specifies that the fetch method shall return a new instance of the requested class, mapping the columns to named properties in the class (setter method is called if defined in the requested class).
-   `FETCH_INTO` Specifies that the fetch method shall update an existing instance of the requested class, mapping the columns to named properties in the class (setter method is called if defined in the requested class).
-   `FETCH_FUNC` Allows completely customize the way data is treated on the fly.
-   `FETCH_NAMED` Specifies that the fetch method shall return each row as a key-value object keyed by column name as returned in the corresponding result set. If the result set contains multiple columns with the same name, Npdo::FETCH_NAMED returns an array of values per column name.
-   `FETCH_KEY_PAIR` Fetch a two-column result into a key-value object where the first column is a key and the second column is the value.
-   `FETCH_GROUP` Group return by values. Usually combined with Npdo::FETCH_COLUMN or Npdo::FETCH_KEY_PAIR.
-   `FETCH_UNIQUE` Fetch only the unique values.
-   `FETCH_CLASSTYPE` Determine the class name from the value of first column.
-   `FETCH_ORI_NEXT` Fetch the next row in the result set.
-   `FETCH_ORI_PRIOR` Fetch the previous row in the result set.
-   `FETCH_ORI_FIRST` Fetch the first row in the result set.
-   `FETCH_ORI_LAST` Fetch the last row in the result set.
-   `FETCH_ORI_ABS` Fetch the requested row by row number from the result set.
-   `FETCH_ORI_REL` Fetch the requested row by relative position from the current position of the cursor in the result set.

### Npdo Attributes

-   `ATTR_DEFAULT_FETCH_MODE` Set the default fetch mode [Default Npdo.FETCH_NUM]
-   `ATTR_DEBUG` Determines if DEBUG mode is enabled. Can take one of the following values: [Default Npdo.DEBUG_DISABLED]
    -   `DEBUG_DISABLED` Disable DEBUG mode
    -   `DEBUG_ENABLED` Enable DEBUG mode
-   `ATTR_CASE` Force column names to a specific case. Can take one of the following values: [Default Npdo.CASE_NATURAL]
    -   `CASE_NATURAL` Leave column names as returned by the database driver.
    -   `CASE_LOWER` Force column names to upper case.
    -   `CASE_UPPER` Force column names to lower case.
-   `ATTR_NULLS` Determines if and how null and empty strings should be converted. Can take one of the following values: [Default Npdo.NULL_NATURAL]
    -   `NULL_NATURAL` No conversion takes place.
    -   `NULL_EMPTY_STRING` Empty strings get converted to null.
    -   `NULL_TO_STRING` null gets converted to an empty string.
-   `ATTR_DRIVER_NAME` Returns the name of the driver.

## Driver Options

Each driver uses the connection options of the corresponding npm package.\
Debug mode, is defined through Npdo Attributes, custom debug connection options, will be ignored.

### Mysql Options

[https://github.com/mysqljs/mysql#connection-options](https://github.com/mysqljs/mysql#connection-options)

new option added:

-   hosts: string[]

> Hosts should be a list of host or host:port, the pool will use at random one of this hosts to get connection

### Sqlite Options

[https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options)\

new option added:

-   path: string

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

**`killResource` should always be false, before activating this option, verify that you have committed or rolled back all transactions and verified that you have executed all prepared statments**

> When 'beginTransaction()' is called connection will be released to the pool only after 'commit()' or 'rollback()' is called.

> When 'prepare()' is called, connection will be released to the pool only after first 'execute()' is called.

**`created` callback should be used only to set session variables on the connection before it gets used.**

```js
{
    created: async (uuid, connection) => {
        await connection.query('SET SESSION auto_increment_increment=1');
    };
}
```

## Connection

this connection should be used only to set session variables before it gets used.

-   query(sql: string) : Promise<void>;

## Transaction

-   prototype.commit(): Promise<void>;
-   prototype.rollback(): Promise<void>;
-   prototype.exec(sql: string): Promise<number>
-   prototype.prepare(sql: string): Promise<[NpdoPreparedStatement](#prepared-statement)>
-   prototype.query(sql: string, fetchMode?: number, columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]): Promise<[NpdoStatement](#statement)>
-   prototype.disconnect(): Promise<void>

## Statement

-   prototype.getAttribute([attribute](#npdo-attributes): string): string | number;
-   prototype.setAttribute([attribute](#npdo-attributes): string, value: number | string): boolean;
-   prototype.columnCount(): number;
-   prototype.debug(): string;
-   prototype.fetch<T>(mode?: [number](#npdo-constants), cursorOrientation?: number): T | null;
-   prototype.fetchAll<T>(mode?: [number](#npdo-constants), columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]): T[];
-   prototype.fetchColumn(column: number): ColumnFecth | null;
-   prototype.fetchObject<T>(fnOrObject?: Function | object, constructorArgs?: any[]): T | null;
-   prototype.getColumnMeta(column: number): NpdoColumnData | null;
-   prototype.rowCount(): number;
-   prototype.lastInsertId(): string | bigint | number | null;
-   prototype.setFetchMode(mode: [number](#npdo-constants), columnOrFnOrObject?: number | object | Function, constructorArgs?: any[]): void;

## Prepared Statement

extends [Statement](#statement)

-   prototype.bindValue(key: string | number, value: [NpdoPreparedStatement.ValidBindings](#valid-bindings)): void;
-   prototype.execute(params?: [NpdoPreparedStatement.Params](#params)): Promise<void>;

### Valid Bindings

-   number
-   string
-   bigint
-   Buffer
-   Date
-   null
-   boolean

### Params

Array of [ValidBindings](#valid-bindings)]\
or a key-value object

## Logger

Npdo by default doesn't log anything, you can assign a custom log for Npdo to intercept messages.

```js
const Npdo = require('npdo');
// ES6 or Typescrypt
import Npdo from 'npdo';
Npdo.setLogger((message: any, level?: any) => {
    console.log(message, level);
});
```

## Debug

If you are running into problems, one thing that may help is enabling the debug mode for the connection.\
You can enable debug using [debug](#driver-options) parameter.\
This will print extra information on stdout.
