import * as sqlite from 'better-sqlite3';
import * as mysql from 'mysql2/promise';
import { Pool } from 'tarn';
import { PoolOptions } from 'tarn/dist/Pool';

export type NpdoTransactionConstructor = new (
    connection: NpdoRawConnection,
    attributes: NpdoAttributes
) => NpdoTransaction;

export type NpdoStatementConstructor = new (
    connection: NpdoRawConnection,
    attributes: NpdoAttributes,
    fetchMode?: number,
    numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
    constructorArgs?: any[]
) => NpdoStatement;

export type NpdoPreparedStatementConstructor = new (
    connection: NpdoRawConnection,
    attributes: NpdoAttributes,
    fetchMode?: number,
    numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
    constructorArgs?: any[]
) => NpdoPreparedStatement;

export interface NpdoConnection {
    /**
     *
     * @param sql
     * @returns
     */
    query: (sql: string) => Promise<void>;
}

export interface NpdoPool<T> extends Pool<T> {
    writeLog: (message: string, logLevel: string) => void;
}

export interface NpdoRawConnection {
    columns: NpdoColumnData[];
    sql: string;
    params: NpdoPreparedStatement.Params | null;

    beginTransaction: () => Promise<void>;

    prepare: (sql: string) => Promise<void>;

    execute: (params?: NpdoPreparedStatement.Params) => Promise<void>;

    bindValue: (key: string | number, value: NpdoPreparedStatement.ValidBindings) => void;

    query: (sql: string) => Promise<void>;

    fetch: <T extends FetchType>(
        adapter: (row: NpdoRowData) => SingleFetchType<T> | null,
        cursorOrientation: number
    ) => SingleFetchType<T> | null;
    fetchAll: <T extends FetchType>(adapter: (rows: NpdoRowData[]) => AllFetchType<T>) => AllFetchType<T>;

    commit: () => Promise<void>;
    rollback: () => Promise<void>;
    log: (message: any, logLevel: string) => void;

    rowCount: () => number;
    lastInsertId: () => string | number | bigint | null;
}

export interface NpdoStatement {
    fetch: <T extends FetchType>(mode?: number, cursorOrientation?: number) => SingleFetchType<T> | null;

    fetchAll: <T extends FetchType>(
        mode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => AllFetchType<T>;

    fetchColumn: (column: number) => ColumnFetch | null;

    fetchObject: <T>(classOrObject: Function, constructorArgs?: any[]) => T | null;

    getColumnMeta: (column: number) => NpdoColumnData | null;

    rowCount: () => number;

    lastInsertId: () => string | number | bigint | null;

    setFetchMode: (
        mode: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => void;

    columnCount: () => number;

    getAttribute: (attribute: string) => string | number;

    setAttribute: (attribute: string, value: number | string) => boolean;

    debug: () => string;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace NpdoStatement {
    interface FetchParameters {
        fetchMode: number;
        classConstructorArgs: any[];
        classToFetch: null | FunctionConstructor;
        fnToFetch: null | FetchFunctionClosure;
        objectToFetch: null | object;
        columnToFetch: number;
    }
}

export interface NpdoTransaction {
    commit: () => Promise<void>;

    rollback: () => Promise<void>;

    exec: (sql: string) => Promise<number>;

    prepare: (sql: string, attributes?: NpdoAttributes) => Promise<NpdoPreparedStatement>;

    query: (
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => Promise<NpdoStatement>;
}

export interface NpdoPreparedStatement extends NpdoStatement {
    /**
     * Numeric key must start from 1
     */
    bindValue: (key: string | number, value: NpdoPreparedStatement.ValidBindings) => void;

    execute: (params?: NpdoPreparedStatement.Params) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace NpdoPreparedStatement {
    interface ObjectParams {
        [key: string]: ValidBindings;
    }

    interface ObjectParamsDescriptor {
        index: number;
        name: string;
        key: string;
        identifier: string;
        aliases: string[];
    }

    type ValidBindings = string | bigint | number | boolean | Date | Buffer | null;
    type ArrayParams = ValidBindings[];
    type Params = ArrayParams | ObjectParams;

    type Placeholder = '?';
    type Identifiers = Array<':' | '@' | '$'>;
    type NegativeLooks = Array<'"' | "'" | '`' | '%'>;
}

export interface NpdoDriver {
    beginTransaction: () => Promise<NpdoTransaction>;

    disconnect: () => Promise<void>;

    prepare: (sql: string, attributes?: NpdoAttributes) => Promise<NpdoPreparedStatement>;

    query: (
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => Promise<NpdoStatement>;

    on: (eventName: 'log', handler: (level: string, message: string) => void) => void;

    getAttribute: (attribute: string) => string | number;

    setAttribute: (attribute: string, value: number | string) => boolean;
}

export interface InternalNpdoPoolOptions<T> extends PoolOptions<T> {
    killResource?: boolean;
    killTimeoutMillis?: number;
    kill: (resource: T) => any;
}

export interface NpdoPoolOptions {
    /**
     * minimum pool size
     *
     * [Default = 2]
     */
    min?: number;
    /**
     * maximum pool size
     *
     * [Default = 10]
     */
    max?: number;
    /**
     * acquire promises are rejected after this many milliseconds
     * if a resource cannot be acquired
     *
     * [Default 10000]
     */
    acquireTimeoutMillis?: number;
    /**
     * create operations are cancelled after this many milliseconds
     * if a resource cannot be acquired
     *
     * [Default 5000]
     */
    createTimeoutMillis?: number;
    /**
     * destroy operations are awaited for at most this many milliseconds
     * new resources will be created after this timeout
     *
     * [Default 5000],
     */
    destroyTimeoutMillis?: number;
    /**
     * when pool destroy is executed
     * connection will be released and brutaly killed after this timeut
     *
     * [Default 10000].
     */
    killTimeoutMillis?: number;
    /**
     * enable/disable killTimeout
     *
     * [Default false]
     */
    killResource?: boolean;
    /**
     * Free resources are destroyed after this many milliseconds.
     * Note that if min > 0, some resources may be kept alive for longer.
     * To reliably destroy all idle resources, set min to 0.
     *
     * [Default 30000]
     */
    idleTimeoutMillis?: number;
    /**
     * how long to idle after failed create before trying again
     *
     * [Default 200]
     */
    createRetryIntervalMillis?: number;
    /**
     * how often to check for idle resources to destroy
     *
     * [Default 500]
     */
    reapIntervalMillis?: number;
    /**
     * Define Custom Created Callback.
     * Error on Created Callback will be logged and not raised
     */
    created?: (uuid: string, connection: NpdoConnection) => Promise<void>;
    /**
     * Define Custom Destroyed Callback.
     * Error on Destroyed Callback will be logged and not raised
     */
    destroyed?: (uuid: string) => Promise<void>;
    /**
     * Define Custom Acquired Callback.
     */
    acquired?: (uuid: string) => void;
    /**
     * Define Custom Release Callback.
     */
    released?: (uuid: string) => void;
    /**
     * Define Custom Kill Callback.
     */
    killed?: (uuid: string) => void;
}

export interface NpdoAttributes {
    [key: string]: number | string;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace NpdoDriver {
    interface MysqlOptions extends mysql.ConnectionOptions {
        /**
         * List of host or host:port to make Round-robin connections
         */
        hosts?: string[];
    }

    interface SqliteOptions extends sqlite.Options {
        path: string;
    }

    type Options = MysqlOptions | SqliteOptions;

    interface sqlitePoolConnection extends sqlite.Database {
        __npdo_uuid: string;
    }

    interface mysqlPoolConnection extends mysql.Connection {
        __npdo_uuid: string;
    }

    type PoolConnection = sqlitePoolConnection | mysqlPoolConnection;

    interface instances {
        preparedStatement: NpdoPreparedStatementConstructor;
        statement: NpdoStatementConstructor;
        transaction: NpdoTransactionConstructor;
    }
}

export type NpdoRowData = NpdoColumnValue[];

export type NpdoColumnValue = string | bigint | Buffer | number | null;
export interface NpdoAffectingData {
    lastInsertRowid?: string | number | bigint;
    affectedRows?: number;
}

export interface NpdoColumnData {
    name: string;
}

export type NpdoLogger = (message: any, level: any) => any;

export type NpdoAvailableDriver = 'mysql' | 'mariadb' | 'sqlite' | 'sqlite3';

export type FetchFunctionClosure = (...values: NpdoColumnValue[]) => any;

export interface KeyPairFetch {
    [key: string]: NpdoColumnValue;
}

export interface GroupFetch<T extends AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any> {
    [key: string]: T[];
}

export interface UniqueFetch<T extends AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any> {
    [key: string | number]: T;
}

export interface AssociativeFetch {
    [key: string]: NpdoColumnValue;
}

export interface BothFetch {
    [key: string | number]: NpdoColumnValue;
}

export interface NamedFetch {
    [key: string]: NpdoColumnValue | NpdoColumnValue[];
}

export type ColumnFetch = NpdoColumnValue;

export type NumFetch = NpdoColumnValue[];

export type FetchType =
    | KeyPairFetch
    | GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    | UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    | AssociativeFetch
    | BothFetch
    | NamedFetch
    | ColumnFetch
    | NumFetch
    | any;

// export type GroupFetchType<T> = T extends AssociativeFetch
//     ? AssociativeFetch
//     : T extends BothFetch
//     ? BothFetch
//     : T extends NamedFetch
//     ? NamedFetch
//     : T extends NumFetch
//     ? NumFetch
//     : T extends ColumnFetch
//     ? ColumnFetch
//     : T;

// export type UniqueFetchType<T> = T extends AssociativeFetch
//     ? AssociativeFetch
//     : T extends BothFetch
//     ? BothFetch
//     : T extends NamedFetch
//     ? NamedFetch
//     : T extends NumFetch
//     ? NumFetch
//     : T extends ColumnFetch
//     ? ColumnFetch
//     : T;

export type SingleFetchType<T> = T extends KeyPairFetch
    ? never
    : T extends GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? never
    : T extends UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? never
    : T extends AssociativeFetch
    ? AssociativeFetch
    : T extends BothFetch
    ? BothFetch
    : T extends NamedFetch
    ? NamedFetch
    : T extends ColumnFetch
    ? ColumnFetch
    : T extends NumFetch
    ? NumFetch
    : T;

export type AllFetchType<T> = T extends KeyPairFetch
    ? KeyPairFetch
    : T extends GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? GroupFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    : T extends UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    ? UniqueFetch<AssociativeFetch | BothFetch | NamedFetch | NumFetch | ColumnFetch | any>
    : T extends AssociativeFetch
    ? AssociativeFetch[]
    : T extends BothFetch
    ? BothFetch[]
    : T extends NamedFetch
    ? NamedFetch[]
    : T extends ColumnFetch
    ? ColumnFetch[]
    : T extends NumFetch
    ? NumFetch[]
    : T[];
