import * as mysql from 'mysql2/promise';

export declare interface Pdo {
    beginTransaction: () => Promise<Pdo.Transaction>;

    disconnect: () => Promise<void>;

    exec: (sql: string) => Promise<number>;

    prepare: (sql: string) => Promise<Pdo.Statement>;

    query: (
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ) => Promise<Pdo.Statement>;
}

export declare namespace Pdo {
    // type FETCH_DEFAULT = number;
    // type FETCH_OBJ = number;
    // type FETCH_CLASS = number;
    // type FETCH_COLUMN = number;
    // type FETCH_ARRAY = number;
    // type FETCH_INTO = number;
    // type FETCH_ORI_NEXT = number;
    // type FETCH_ORI_PRIOR = number;
    // type FETCH_ORI_FIRST = number;
    // type FETCH_ORI_LAST = number;
    // type FETCH_ORI_ABS = number;
    // type FETCH_ORI_REL = number;
    type availableDrivers = 'mysql' | 'sqlite';

    type ConnectCallbackFunction = (connection: mysql.PoolConnection) => Promise<void>;
    interface Driver {
        beginTransaction: () => Promise<Pdo.Transaction>;

        disconnect: () => Promise<void>;

        prepare: (sql: string) => Promise<Pdo.PreparedStatement>;

        query: (
            sql: string,
            fetchMode?: number,
            columnOrFnOrObject?: number | Function | object,
            constructorArgs?: any[]
        ) => Promise<Pdo.Statement>;
    }

    declare namespace Driver {
        type Options = mysql.PoolOptions;
        type Constructor = new (
            options: Pdo.Driver.Options,
            connectCallback: ConnectCallbackFunction | null
        ) => Pdo.Driver;

        declare namespace Mysql {
            interface Connection {
                fields: FieldPacket[];
                sql: string;
                params: Pdo.PreparedStatement.Params | null;

                beginTransaction: () => Promise<void>;

                prepare: (sql: string) => Promise<void>;

                execute: (params?: Pdo.PreparedStatement.Params) => Promise<void>;

                freeCursor: () => void;

                close: () => Promise<void>;

                bindValue: (
                    key: string | number,
                    value: Pdo.PreparedStatement.ValidBindings | Pdo.PreparedStatement.ValidBindings[]
                ) => void;

                query: (sql: string) => Promise<void>;

                fetch: <T>(adapter: Function) => Iterable<T>;
                fetchAll: <T>(adapter: Function) => T[];

                commit: () => Promise<void>;
                rollback: () => Promise<void>;

                rowCount: () => number;
                lastInsertId: () => string | number | null;
            }
        }
    }

    interface Drivers {
        [key: string]: Pdo.Driver.Constructor;
    }

    interface Transaction {
        commit: () => Promise<void>;

        rollback: () => Promise<void>;

        exec: (sql: string) => Promise<number>;

        prepare: (sql: string) => Promise<Pdo.PreparedStatement>;

        query: (
            sql: string,
            fetchMode?: number,
            columnOrFnOrObject?: number | Function | object,
            constructorArgs?: any[]
        ) => Promise<Pdo.Statement>;
    }

    interface Statement {
        fetch: <T>(mode?: number, cursorOrientation?: number, cursorOffset?: number) => Iterable<T>;

        fetchAll: <T>(mode?: number, columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]) => T[];

        fetchColumn: <T>(column: number) => Iterable<T>;

        fetchObject: <T>(fnOrObject?: Function | object, constructorArgs?: any[]) => Iterable<T>;

        getColumnMeta: (column: number) => any;

        rowCount: () => number;

        lastInsertId: () => string | number | null;

        setFetchMode: (mode: number, columnOrFnOrObject?: number | Function | object, constructorArgs?: any[]) => void;

        columnCount: () => number;

        debug: () => string;
    }

    interface PreparedStatement extends Statement {
        /**
         * Numeric key must start from 1
         */
        bindValue: (
            key: string | number,
            value: Pdo.PreparedStatement.ValidBindings | Pdo.PreparedStatement.ValidBindings[]
        ) => void;

        execute: (params?: Pdo.PreparedStatement.Params) => Promise<void>;

        freeCursor: () => void;

        close: () => Promise<void>;
    }

    declare namespace PreparedStatement {
        interface ObjectParams {
            [key: string]: ValidBindings | ValidBindings[];
        }

        interface ObjectParamsDescriptor {
            index: number;
            name: string;
            key: string;
            identifier: string;
            aliases: string[];
        }

        type ValidBindings = string | bigint | number | boolean | Date | Buffer | null;
        type ArrayParams = Array<ValidBindings | ValidBindings[]>;
        type Params = ArrayParams | ObjectParams;

        type Placeholder = '?';
        type Identifiers = Array<':' | '@'>;
        type NegativeLooks = Array<'"' | "'" | '`' | '%'>;
    }
}
