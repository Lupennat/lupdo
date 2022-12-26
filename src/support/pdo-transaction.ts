'use strict';

import PdoAttributes from '../types/pdo-attributes';
import { PdoTransactionPreparedStatementI } from '../types/pdo-prepared-statement';
import PdoRawConnectionI from '../types/pdo-raw-connection';
import PdoStatementI from '../types/pdo-statement';
import PdoTransactionI from '../types/pdo-transaction';
import PdoStatement from './pdo-statement';
import PdoTransactionPreparedStatement from './pdo-transaction-prepared-statement';

class PdoTransaction implements PdoTransactionI {
    constructor(protected readonly connection: PdoRawConnectionI, protected readonly attributes: PdoAttributes) {}

    async commit(): Promise<void> {
        return await this.connection.commit();
    }

    async rollback(): Promise<void> {
        return await this.connection.rollback();
    }

    async exec(sql: string): Promise<number> {
        return await this.connection.exec(sql);
    }

    async prepare(sql: string): Promise<PdoTransactionPreparedStatementI> {
        await this.connection.prepare(sql);
        return new PdoTransactionPreparedStatement(this.connection, this.attributes);
    }

    async query(sql: string): Promise<PdoStatementI> {
        await this.connection.query(sql);
        return new PdoStatement(this.connection, this.attributes);
    }
}

export default PdoTransaction;
