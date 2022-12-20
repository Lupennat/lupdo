'use strict';

import PdoAttributes from '../types/pdo-attributes';
import { FetchFunctionClosure } from '../types/pdo-fetch';
import PdoPreparedStatementI from '../types/pdo-prepared-statement';
import PdoRawConnectionI from '../types/pdo-raw-connection';
import PdoStatementI from '../types/pdo-statement';
import PdoTransactionI from '../types/pdo-transaction';
import PdoPreparedStatement from './pdo-prepared-statement';
import PdoStatement from './pdo-statement';

class PdoTransaction implements PdoTransactionI {
    constructor(protected readonly connection: PdoRawConnectionI, protected readonly attributes: PdoAttributes) {}

    async commit(): Promise<void> {
        return await this.connection.commit();
    }

    async rollback(): Promise<void> {
        return await this.connection.rollback();
    }

    async exec(sql: string): Promise<number> {
        const statement = await this.query(sql);
        return statement.rowCount();
    }

    async prepare(sql: string, attributes: PdoAttributes = {}): Promise<PdoPreparedStatementI> {
        await this.connection.prepare(sql);
        return new PdoPreparedStatement(this.connection, Object.assign({}, this.attributes, attributes));
    }

    async query(
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ): Promise<PdoStatementI> {
        await this.connection.query(sql);
        return new PdoStatement(
            this.connection,
            this.attributes,
            fetchMode,
            numberOrClassOrFnOrObject,
            constructorArgs
        );
    }
}

export default PdoTransaction;
