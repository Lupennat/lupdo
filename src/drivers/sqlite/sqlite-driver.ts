import Database from 'better-sqlite3';
import {
    NpdoPoolOptions,
    NpdoDriver as NpdoDriverI,
    NpdoTransaction as NpdoTransactionI,
    NpdoPreparedStatement as NpdoPreparedStatementI,
    NpdoStatement as NpdoStatementI,
    NpdoConnection
} from '../../types';
import NpdoPreparedStatement from '../npdo-prepared-statement';
import NpdoStatement from '../npdo-statement';
import NpdoTransaction from '../npdo-transaction';
import SqliteConnection from './sqlite-connection';
import SqliteRawConnection from './sqlite-raw-connection';

import NpdoDriver from '../npdo-driver';

class SqliteDriver extends NpdoDriver {
    constructor(protected options: NpdoDriverI.SqliteOptions, poolOptions: NpdoPoolOptions) {
        super(poolOptions);
    }

    protected async createRawConnection(): Promise<NpdoDriverI.sqlitePoolConnection> {
        const { path, debug, ...sqliteOptions } = this.options;
        if (debug === true) {
            const customVerbose = sqliteOptions.verbose;
            sqliteOptions.verbose = (...args) => {
                if (typeof customVerbose === 'function') {
                    customVerbose.call(customVerbose, ...args);
                }
                console.log(...args);
            };
        }
        return new Database(path, sqliteOptions) as NpdoDriverI.sqlitePoolConnection;
    }

    protected createNpdoConnection(connection: NpdoDriverI.sqlitePoolConnection): NpdoConnection {
        return new SqliteConnection(connection);
    }

    protected async destroyConnection(connection: NpdoDriverI.sqlitePoolConnection): Promise<void> {
        await connection.close();
    }

    public async beginTransaction(): Promise<NpdoTransactionI> {
        const connection = new SqliteRawConnection(this.pool);
        await connection.beginTransaction();
        return new NpdoTransaction(connection);
    }

    public async disconnect(): Promise<void> {
        await this.pool.destroy();
    }

    public async prepare(sql: string): Promise<NpdoPreparedStatementI> {
        const connection = new SqliteRawConnection(this.pool);
        await connection.prepare(sql);
        return new NpdoPreparedStatement(connection);
    }

    public async query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatementI> {
        const connection = new SqliteRawConnection(this.pool);
        await connection.query(sql);
        return new NpdoStatement(connection, fetchMode, columnOrFnOrObject, constructorArgs);
    }
}

export = SqliteDriver;
