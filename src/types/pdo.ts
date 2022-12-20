import { FetchFunctionClosure } from './pdo-fetch';
import { PoolConnection } from './pdo-pool';
import PdoPreparedStatementI from './pdo-prepared-statement';
import PdoStatementI from './pdo-statement';
import PdoTransactionI from './pdo-transaction';

export type PdoLogger = (message: any, level: any) => any;

export type PdoAvailableDriver = 'mysql' | 'mariadb' | 'sqlite' | 'sqlite3';

export default interface PdoI {
    beginTransaction: () => Promise<PdoTransactionI>;

    disconnect: () => Promise<void>;

    prepare: (sql: string) => Promise<PdoPreparedStatementI>;

    query: (
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ) => Promise<PdoStatementI>;

    getAttribute: (attribute: string) => string | number;

    setAttribute: (attribute: string, value: number | string) => boolean;

    getRawPoolConnection: () => Promise<PoolConnection>;
}
