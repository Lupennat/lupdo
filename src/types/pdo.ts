import { RawPoolConnection } from './pdo-pool';
import PdoPreparedStatementI from './pdo-prepared-statement';
import PdoStatementI from './pdo-statement';
import PdoTransactionI from './pdo-transaction';

export type PdoLogger = (message: any, level: any) => any;

export default interface PdoI {
    beginTransaction: () => Promise<PdoTransactionI>;

    prepare: (sql: string) => Promise<PdoPreparedStatementI>;

    exec: (sql: string) => Promise<number>;

    query: (sql: string) => Promise<PdoStatementI>;

    getAttribute: (attribute: string) => string | number;

    setAttribute: (attribute: string, value: number | string) => boolean;

    getRawPoolConnection: () => Promise<RawPoolConnection>;

    disconnect: () => Promise<void>;

    reconnect: () => void;
}
