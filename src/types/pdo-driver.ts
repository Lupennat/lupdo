import PdoAttributes from './pdo-attributes';
import { PoolOptions, RawPoolConnection } from './pdo-pool';
import PdoPreparedStatementI, { PdoPreparedStatementConstructor } from './pdo-prepared-statement';
import PdoStatementI, { PdoStatementConstructor } from './pdo-statement';
import PdoTransactionI, { PdoTransactionConstructor } from './pdo-transaction';

export interface DriverInstances {
    preparedStatement: PdoPreparedStatementConstructor;
    statement: PdoStatementConstructor;
    transaction: PdoTransactionConstructor;
}

export type PdoDriverConstructor = new (
    driver: string,
    options: any,
    poolOptions: PoolOptions,
    attributes: PdoAttributes
) => PdoDriverI;

export default interface PdoDriverI {
    beginTransaction: () => Promise<PdoTransactionI>;

    disconnect: () => Promise<void>;

    reconnect: () => void;

    prepare: (sql: string) => Promise<PdoPreparedStatementI>;

    exec: (sql: string) => Promise<number>;

    query: (sql: string) => Promise<PdoStatementI>;

    on: (eventName: 'log', handler: (level: string, message: string) => void) => void;

    getAttribute: (attribute: string) => string | number;

    setAttribute: (attribute: string, value: number | string) => boolean;

    getRawPoolConnection: () => Promise<RawPoolConnection>;

    getRawDriverConnection: <T>() => Promise<T>;

    getVersion: () => Promise<string>;
}
