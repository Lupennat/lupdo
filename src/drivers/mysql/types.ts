import { NpdoPreparedStatement } from '../../types';

export interface Connection {
    fields: any[];
    sql: string;
    params: NpdoPreparedStatement.Params | null;

    beginTransaction: () => Promise<void>;

    prepare: (sql: string) => Promise<void>;

    execute: (params?: NpdoPreparedStatement.Params) => Promise<void>;

    freeCursor: () => void;

    close: () => Promise<void>;

    bindValue: (
        key: string | number,
        value: NpdoPreparedStatement.ValidBindings | NpdoPreparedStatement.ValidBindings[]
    ) => void;

    query: (sql: string) => Promise<void>;

    fetch: <T>(adapter: Function) => Iterable<T>;
    fetchAll: <T>(adapter: Function) => T[];

    commit: () => Promise<void>;
    rollback: () => Promise<void>;

    rowCount: () => number;
    lastInsertId: () => string | number | null;
}
