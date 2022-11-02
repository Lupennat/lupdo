import * as sqlite from 'better-sqlite3';
import * as mysql from 'mysql2/promise';

export interface NpdoConnection {
    query: (sql: string) => Promise<void>;
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

    fetch: <T>(adapter: Function, cursorOrientation?: number, cursorOffset?: number) => Iterable<T>;
    fetchAll: <T>(adapter: Function) => T[];

    commit: () => Promise<void>;
    rollback: () => Promise<void>;

    rowCount: () => number;
    lastInsertId: () => string | number | bigint | null;
}

export interface NpdoStatement {
    fetch: <T>(mode?: number, cursorOrientation?: number, cursorOffset?: number) => Iterable<T>;

    fetchAll: <T>(mode?: number, columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]) => T[];

    fetchColumn: <T>(column: number) => Iterable<T>;

    fetchObject: <T>(fnOrObject?: Function | object, constructorArgs?: any[]) => Iterable<T>;

    getColumnMeta: (column: number) => any;

    rowCount: () => number;

    lastInsertId: () => string | number | bigint | null;

    setFetchMode: (mode: number, columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]) => void;

    columnCount: () => number;

    debug: () => string;
}

export interface NpdoTransaction {
    commit: () => Promise<void>;

    rollback: () => Promise<void>;

    exec: (sql: string) => Promise<number>;

    prepare: (sql: string) => Promise<NpdoPreparedStatement>;

    query: (
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
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

    prepare: (sql: string) => Promise<NpdoPreparedStatement>;

    query: (
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ) => Promise<NpdoStatement>;

    on: (eventName: 'log', handler: (level: string, message: string) => void) => void;
}

export interface NpdoPoolOptions {
    min: number;
    max: number;
    acquireTimeoutMillis?: number;
    createTimeoutMillis?: number;
    destroyTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    createRetryIntervalMillis?: number;
    reapIntervalMillis?: number;
    propagateCreateError?: boolean;
    created?: (uuid: string, connection: NpdoConnection) => Promise<void>;
    destroyed?: (uuid: string) => Promise<void>;
    acquired?: (uuid: string) => void;
    released?: (uuid: string) => void;
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
        debug?: boolean;
    }

    type Options = MysqlOptions | SqliteOptions;

    interface sqlitePoolConnection extends sqlite.Database {
        __npdo_uuid: string;
    }

    interface mysqlPoolConnection extends mysql.Connection {
        __npdo_uuid: string;
    }

    type PoolConnection = sqlitePoolConnection | mysqlPoolConnection;
}

export interface NpdoRowData {
    [column: string]: any;
}

export interface NpdoAffectingData {
    lastInsertRowid?: string | number | bigint;
    affectedRows?: number;
}

export interface NpdoColumnData {
    name: string;
}

export type NpdoLogger = (message: any, level: any) => any;

export type NpdoAvailableDriver = 'mysql' | 'mariadb' | 'sqlite' | 'sqlite3';
