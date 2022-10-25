'use strict';

import { Pdo } from '../../../@types/index';
import MysqlPreparedStatement from './mysql-prepared-statement';
import MysqlStatement from './mysql-statement';

class MysqlTransaction implements Pdo.Transaction {
    constructor(protected readonly connection: Pdo.Driver.Mysql.Connection) {}

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

    async prepare(sql: string): Promise<Pdo.PreparedStatement> {
        await this.connection.prepare(sql);
        return new MysqlPreparedStatement(this.connection);
    }

    async query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<Pdo.Statement> {
        await this.connection.query(sql);
        return new MysqlStatement(this.connection, fetchMode, columnOrFnOrObject, constructorArgs);
    }
}

export = MysqlTransaction;
