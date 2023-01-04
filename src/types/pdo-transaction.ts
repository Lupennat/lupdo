import { PdoTransactionPreparedStatementConstructor, PdoTransactionPreparedStatementI } from './pdo-prepared-statement';
import PdoRawConnectionI from './pdo-raw-connection';
import PdoStatementI, { PdoStatementConstructor } from './pdo-statement';

export interface TransactionInstances {
    preparedStatement: PdoTransactionPreparedStatementConstructor;
    statement: PdoStatementConstructor;
}

export type PdoTransactionConstructor = new (connection: PdoRawConnectionI) => PdoTransactionI;

export default interface PdoTransactionI {
    commit: () => Promise<void>;

    rollback: () => Promise<void>;

    exec: (sql: string) => Promise<number>;

    prepare: (sql: string) => Promise<PdoTransactionPreparedStatementI>;

    query: (sql: string) => Promise<PdoStatementI>;
}
