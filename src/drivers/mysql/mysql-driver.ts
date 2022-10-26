import MysqlConnection from './mysql-connection';
import MysqlTransaction from './mysql-transaction';
import MysqlStatement from './mysql-statement';
import { createPool, Pool, PoolOptions } from 'mysql2/promise';
import MysqlPreparedStatement from './mysql-prepared-statement';
import { NpdoDriver, NpdoPreparedStatement, NpdoStatement, NpdoTransaction } from '../../types';

class MysqlDriver implements NpdoDriver {
    protected readonly pool: Pool;

    constructor(options: PoolOptions) {
        this.pool = createPool({
            dateStrings: true,
            supportBigNumbers: true,
            ...options
        });

        this.pool.on('connection', async poolConnection => {});

        this.pool.on('release', async poolConnection => {});

        this.pool.on('acquire', async poolConnection => {});

        this.pool.on('enqueue', async () => {});
    }

    public async beginTransaction(): Promise<NpdoTransaction> {
        const connection = new MysqlConnection(this.pool);
        await connection.beginTransaction();
        return new MysqlTransaction(connection);
    }

    public async disconnect(): Promise<void> {
        await this.pool.end();
    }

    public async prepare(sql: string): Promise<NpdoPreparedStatement> {
        const connection = new MysqlConnection(this.pool);
        await connection.prepare(sql);
        return new MysqlPreparedStatement(connection);
    }

    public async query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatement> {
        const connection = new MysqlConnection(this.pool);
        await connection.query(sql);
        return new MysqlStatement(connection, fetchMode, columnOrFnOrObject, constructorArgs);
    }
}

export = MysqlDriver;
