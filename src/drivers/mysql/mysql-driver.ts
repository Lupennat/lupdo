import MysqlConnection from './mysql-connection';
import MysqlTransaction from './mysql-transaction';
import MysqlStatement from './mysql-statement';

import { createPool, Pool, PoolOptions } from 'mysql2/promise';
import { Pdo } from '../../../@types/index';
import MysqlPreparedStatement from './mysql-prepared-statement';

class MysqlDriver implements Pdo.Driver {
    protected readonly pool: Pool;

    constructor(options: PoolOptions, connectCallback: Pdo.ConnectCallbackFunction | null) {
        this.pool = createPool({
            dateStrings: true,
            supportBigNumbers: true,
            ...options
        });

        this.pool.on('connection', async poolConnection => {
            console.log('connection');
            if (typeof connectCallback === 'function') {
                await connectCallback(poolConnection);
            }
        });

        this.pool.on('release', async poolConnection => {
            console.log('release');
        });

        this.pool.on('acquire', async poolConnection => {
            console.log('acquire');
        });

        this.pool.on('enqueue', async () => {
            console.log('enqueue');
        });
    }

    public async beginTransaction(): Promise<Pdo.Transaction> {
        const connection = new MysqlConnection(this.pool);
        await connection.beginTransaction();
        return new MysqlTransaction(connection);
    }

    public async disconnect(): Promise<void> {
        await this.pool.end();
    }

    public async prepare(sql: string): Promise<Pdo.PreparedStatement> {
        const connection = new MysqlConnection(this.pool);
        await connection.prepare(sql);
        return new MysqlPreparedStatement(connection);
    }

    public async query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<Pdo.Statement> {
        const connection = new MysqlConnection(this.pool);
        await connection.query(sql);
        return new MysqlStatement(connection, fetchMode, columnOrFnOrObject, constructorArgs);
    }
}

export = MysqlDriver;
