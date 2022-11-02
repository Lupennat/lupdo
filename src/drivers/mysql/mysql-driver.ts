import { createConnection } from 'mysql2/promise';
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
import MysqlConnection from './mysql-connection';
import MysqlRawConnection from './mysql-raw-connection';
import shuffle from 'lodash.shuffle';
import NpdoDriver from '../npdo-driver';

class MysqlDriver extends NpdoDriver {
    constructor(protected options: NpdoDriverI.MysqlOptions, poolOptions: NpdoPoolOptions) {
        super(poolOptions);
    }

    protected async createRawConnection(): Promise<NpdoDriverI.mysqlPoolConnection> {
        const { hosts, ...mysqlOptions } = this.options;
        if (hosts != null) {
            const randomHost = shuffle<string>(hosts)[0];
            const [host, port] = randomHost.split(':') as [string, string | undefined];
            mysqlOptions.host = host;
            if (port != null && !isNaN(Number(port))) {
                mysqlOptions.port = Number(port);
            }
        }
        return (await createConnection(mysqlOptions)) as NpdoDriverI.mysqlPoolConnection;
    }

    protected createNpdoConnection(connection: NpdoDriverI.mysqlPoolConnection): NpdoConnection {
        return new MysqlConnection(connection);
    }

    protected async destroyConnection(connection: NpdoDriverI.mysqlPoolConnection): Promise<void> {
        await connection.end();
        connection.removeAllListeners();
    }

    public async beginTransaction(): Promise<NpdoTransactionI> {
        const connection = new MysqlRawConnection(this.pool);
        await connection.beginTransaction();
        return new NpdoTransaction(connection);
    }

    public async disconnect(): Promise<void> {
        await this.pool.destroy();
    }

    public async prepare(sql: string): Promise<NpdoPreparedStatementI> {
        const connection = new MysqlRawConnection(this.pool);
        await connection.prepare(sql);
        return new NpdoPreparedStatement(connection);
    }

    public async query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatementI> {
        const connection = new MysqlRawConnection(this.pool);
        await connection.query(sql);
        return new NpdoStatement(connection, fetchMode, columnOrFnOrObject, constructorArgs);
    }
}

export = MysqlDriver;
