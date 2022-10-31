# Npdo

> Npdo is in Alpha Version

Npdo is an abstraction layer used for accessing databases, similar to PHP Data Objects exposes a set of APIs.\
Npdo is not an ORM, Npdo aims to be a stable layer through which to build an ORM or a Query Builder.\
Npdo create a Pool of connection By Default.

-   [Third Party Library](#third-party-library)
-   [Supported Databases](#supported-databases)
-   [Usage](#usage)
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

-   `FETCH_DEFAULT` Specifies that the default fetch mode shall be used. Default is Npdo.FETCH_OBJ
-   `FETCH_OBJ` Specifies that the fetch method shall return each row as an object with property names that correspond to the column names returned in the result set.
-   `FETCH_CLASS` Specifies that the fetch method shall return a new instance of the requested class, mapping the columns to named properties in the class.
-   `FETCH_COLUMN` Specifies that the fetch method shall return only a single requested column from the next row in the result set.
-   `FETCH_ARRAY` Specifies that the fetch method shall return each row as an array indexed by column number as returned in the corresponding result set, starting at column 0.
-   `FETCH_INTO` Specifies that the fetch method shall update an existing instance of the requested class, mapping the columns to named properties in the class.
-   `FETCH_ORI_NEXT` Fetch the next row in the result set. Valid only for scrollable cursors.
-   `FETCH_ORI_PRIOR` Fetch the previous row in the result set. Valid only for scrollable cursors.
-   `FETCH_ORI_FIRST` Fetch the first row in the result set. Valid only for scrollable cursors.
-   `FETCH_ORI_LAST` Fetch the last row in the result set. Valid only for scrollable cursors.
-   `FETCH_ORI_ABS` Fetch the requested row by row number from the result set. Valid only for scrollable cursors.
-   `FETCH_ORI_REL` Fetch the requested row by relative position from the current position of the cursor in the result set. Valid only for scrollable cursors.

## Driver Options

Each driver uses the connection options of the corresponding npm package.\
The only common option is

-   debug: boolean

### Mysql Options

[https://github.com/mysqljs/mysql#connection-options](https://github.com/mysqljs/mysql#connection-options)

### Sqlite Options

[https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options)
new option added:\

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

-   prototype.columnCount(): number;
-   prototype.debug(): string;
-   prototype.fetch<T>(mode?: [number](#npdo-constants), cursorOrientation?: number, cursorOffset?: number): Iterable<T>;
-   prototype.fetchAll<T>(mode?: [number](#npdo-constants), columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]): T[];
-   prototype.fetchColumn<T>(column: number): Iterable<T>;
-   prototype.fetchObject<T>(fnOrObject?: Function | object, constructorArgs?: any[]): Iterable<T>;
-   prototype.getColumnMeta(column: number): any;
-   prototype.rowCount(): number;
-   prototype.lastInsertId(): string | bigint | number | null;
-   prototype.setFetchMode(mode: [number](#npdo-constants), columnOrFnOrObject?: number | object | Function, constructorArgs?: any[]): void;

> cursorOrientation and cursorOffset are not yet implemented

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
