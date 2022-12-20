import * as sqlite from 'better-sqlite3';
import * as mysql from 'mysql2/promise';
import PdoAttributes from './pdo-attributes';
import { FetchFunctionClosure } from './pdo-fetch';
import { RawPoolConnection } from './pdo-pool';
import PdoPreparedStatementI, { PdoPreparedStatementConstructor } from './pdo-prepared-statement';
import PdoStatementI, { PdoStatementConstructor } from './pdo-statement';
import PdoTransactionI, { PdoTransactionConstructor } from './pdo-transaction';

export type MysqlOptions = mysql.ConnectionOptions;

export interface SqliteOptions extends sqlite.Options {
    path: string;
}

export type DriverOptions = MysqlOptions | SqliteOptions;

export interface instances {
    preparedStatement: PdoPreparedStatementConstructor;
    statement: PdoStatementConstructor;
    transaction: PdoTransactionConstructor;
}

export default interface PdoDriverI {
    beginTransaction: () => Promise<PdoTransactionI>;

    disconnect: () => Promise<void>;

    prepare: (sql: string, attributes?: PdoAttributes) => Promise<PdoPreparedStatementI>;

    query: (
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => Promise<PdoStatementI>;

    on: (eventName: 'log', handler: (level: string, message: string) => void) => void;

    getAttribute: (attribute: string) => string | number;

    setAttribute: (attribute: string, value: number | string) => boolean;

    getRawPoolConnection: () => Promise<RawPoolConnection>;
}
