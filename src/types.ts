export interface NpdoStatement {
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
    bindValue: (
        key: string | number,
        value: NpdoPreparedStatement.ValidBindings | NpdoPreparedStatement.ValidBindings[]
    ) => void;

    execute: (params?: NpdoPreparedStatement.Params) => Promise<void>;

    freeCursor: () => void;

    close: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace NpdoPreparedStatement {
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
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace NpdoDriver {
    type Available = 'mysql' | 'sqlite';
    interface Options {
        [key: string]: any;
    }
    type Constructor = new (options: NpdoDriver.Options) => NpdoDriver;
}

export interface NpdoDrivers {
    [key: string]: NpdoDriver.Constructor;
}
