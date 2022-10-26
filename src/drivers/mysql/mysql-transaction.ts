'use strict';

import { NpdoPreparedStatement, NpdoStatement, NpdoTransaction } from '../../types';
import MysqlPreparedStatement from './mysql-prepared-statement';
import MysqlStatement from './mysql-statement';
import { Connection } from './types';

class MysqlTransaction implements NpdoTransaction {
    constructor(protected readonly connection: Connection) {}

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

    async prepare(sql: string): Promise<NpdoPreparedStatement> {
        await this.connection.prepare(sql);
        return new MysqlPreparedStatement(this.connection);
    }

    async query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatement> {
        await this.connection.query(sql);
        return new MysqlStatement(this.connection, fetchMode, columnOrFnOrObject, constructorArgs);
    }
}

export = MysqlTransaction;
