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

// export declare class Npdo {
//     constructor(
//         driver: NNpdo.availableDrivers,
//         options: NNpdo.Driver.Options,
//         connectCallback: NNpdo.ConnectCallbackFunction | null
//     );

//     beginTransaction: () => Promise<Npdo.Transaction>;

//     disconnect: () => Promise<void>;

//     exec: (sql: string) => Promise<number>;

//     prepare: (sql: string) => Promise<Npdo.Statement>;

//     query: (
//         sql: string,
//         fetchMode?: number,
//         columnOrFnOrObject?: number | Function | object,
//         constructorArgs?: any[]
//     ) => Promise<Npdo.Statement>;
// }

// export declare namespace Npdo {
//     // type FETCH_DEFAULT = number;
//     // type FETCH_OBJ = number;
//     // type FETCH_CLASS = number;
//     // type FETCH_COLUMN = number;
//     // type FETCH_ARRAY = number;
//     // type FETCH_INTO = number;
//     // type FETCH_ORI_NEXT = number;
//     // type FETCH_ORI_PRIOR = number;
//     // type FETCH_ORI_FIRST = number;
//     // type FETCH_ORI_LAST = number;
//     // type FETCH_ORI_ABS = number;
//     // type FETCH_ORI_REL = number;

//     // type ConnectCallbackFunction = (connection: mysql.PoolConnection) => Promise<void>;

//     class Mysql implements Npdo.Driver, Npdo.Driver.Constructor {}
//     namespace Mysql {
//         class Transaction implements Npdo.Transaction {}
//         class Statement implements Npdo.Statement {}
//         class PreparedStatement implements NpdoPreparedStatement {}

//     }
// }
