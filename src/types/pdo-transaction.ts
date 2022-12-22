import PdoAttributes from './pdo-attributes';
import PdoPreparedStatementI from './pdo-prepared-statement';
import PdoRawConnectionI from './pdo-raw-connection';
import PdoStatementI from './pdo-statement';

export type PdoTransactionConstructor = new (
    connection: PdoRawConnectionI,
    attributes: PdoAttributes
) => PdoTransactionI;

export default interface PdoTransactionI {
    commit: () => Promise<void>;

    rollback: () => Promise<void>;

    exec: (sql: string) => Promise<number>;

    prepare: (sql: string, attributes?: PdoAttributes) => Promise<PdoPreparedStatementI>;

    query: (sql: string) => Promise<PdoStatementI>;
}
