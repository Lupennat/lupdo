'use strict';

import {
    FetchFunctionClosure,
    NpdoAttributes,
    NpdoPreparedStatement as NpdoPreparedStatementI,
    NpdoRawConnection,
    NpdoStatement as NpdoStatementI,
    NpdoTransaction as NpdoTransactionI
} from '../types';
import NpdoPreparedStatement from './npdo-prepared-statement';
import NpdoStatement from './npdo-statement';

class NpdoTransaction implements NpdoTransactionI {
    constructor(protected readonly connection: NpdoRawConnection, protected readonly attributes: NpdoAttributes) {}

    async commit(): Promise<void> {
        return await this.connection.commit();
    }

    async rollback(): Promise<void> {
        return await this.connection.rollback();
    }

    async exec(sql: string): Promise<number> {
        const statement = await this.prepare(sql);
        await statement.execute();
        return statement.rowCount();
    }

    async prepare(sql: string, attributes: NpdoAttributes = {}): Promise<NpdoPreparedStatementI> {
        await this.connection.prepare(sql);
        return new NpdoPreparedStatement(this.connection, Object.assign({}, this.attributes, attributes));
    }

    async query(
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatementI> {
        await this.connection.query(sql);
        return new NpdoStatement(
            this.connection,
            this.attributes,
            fetchMode,
            numberOrClassOrFnOrObject,
            constructorArgs
        );
    }
}

export = NpdoTransaction;
