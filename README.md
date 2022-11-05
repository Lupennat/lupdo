# Npdo

> Npdo is in Alpha Version

Npdo is an abstraction layer used for accessing databases, similar to PHP Data Objects exposes a set of APIs.\
Npdo is not an ORM, Npdo aims to be a stable layer through which to build an ORM or a Query Builder.\
Npdo create a Pool of connection By Default.

-   [Third Party Library](#third-party-library)
-   [Supported Databases](#supported-databases)
-   [Usage](#usage)
    - [Fetch Modes](FETCH_MODES.md)
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
-   `ATTR_CASE` Force column names to a specific case. Can take one of the following values: [Default Npdo.CASE_NATURAL]
    -   `Npdo.CASE_NATURAL`
    -   `Npdo.CASE_LOWER`
    -   `Npdo.CASE_UPPER`
-   `ATTR_NULLS` Determines if and how null and empty strings should be converted. Can take one of the following values: [Default Npdo.NULL_NATURAL]
    -   `Npdo.NULL_NATURAL`
    -   `Npdo.NULL_EMPTY_STRING`
    -   `Npdo.NULL_TO_STRING`
-   `ATTR_DRIVER_NAME` Returns the name of the driver.


## Driver Options

Each driver uses the connection options of the corresponding npm package.\
The only common option is

-   debug: boolean

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

-   min: number;
-   max: number;
-   acquireTimeoutMillis?: number;
-   createTimeoutMillis?: number;
-   destroyTimeoutMillis?: number;
-   idleTimeoutMillis?: number;
-   createRetryIntervalMillis?: number;
-   reapIntervalMillis?: number;
-   propagateCreateError?: boolean;
-   created?: (uuid: string, connection: [NpdoConnection](#connection)) => Promise<void>;
-   destroyed?: (uuid: string) => Promise<void>;
-   acquired?: (uuid: string) => void;
-   released?: (uuid: string) => void;

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

Npdo by default doesn't log anything, you can assign a custom log for Npdo to intercept messages.\
Error from custom [PoolOptions](#pool-options) `created` and `destroyed` are silently suppressed you can intercept it only from a custom logger.

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
You can enable raw Connection debug using [debug](#driver-options) parameter.\
This will print extra information on stdout.
