import { createConnection as mysql2CreateConnection } from 'mysql2/promise';

import { ATTR_DEBUG, DEBUG_ENABLED } from '../../constants';
import { PdoAvailableDriver } from '../../types/pdo';
import PdoAttributes from '../../types/pdo-attributes';
import PdoConnectionI from '../../types/pdo-connection';
import { MysqlOptions } from '../../types/pdo-driver';
import { PoolOptions, mysqlPoolConnection } from '../../types/pdo-pool';
import PdoRawConnectionI from '../../types/pdo-raw-connection';
import PdoDriver from '../pdo-driver';
import MysqlConnection from './mysql-connection';
import MysqlRawConnection from './mysql-raw-connection';

interface protectedMysqlConnection extends mysqlPoolConnection {
    _fatalError: boolean;
    _protocolError: boolean;
    _closing: boolean;
    stream:
        | undefined
        | {
              destroyed: boolean;
          };
}

class MysqlDriver extends PdoDriver {
    constructor(
        driver: PdoAvailableDriver,
        protected options: MysqlOptions,
        poolOptions: PoolOptions,
        attributes: PdoAttributes
    ) {
        super(driver, poolOptions, attributes);
    }

    protected async createConnection(): Promise<mysqlPoolConnection> {
        const { ...mysqlOptions } = this.options;
        const debugMode = this.getAttribute(ATTR_DEBUG) as number;

        mysqlOptions.queryFormat = undefined;

        return (await mysql2CreateConnection({
            ...mysqlOptions,
            rowsAsArray: true,
            namedPlaceholders: true,
            dateStrings: false,
            supportBigNumbers: true,
            debug: (debugMode & DEBUG_ENABLED) !== 0
        })) as mysqlPoolConnection;
    }

    protected createPdoConnection(connection: mysqlPoolConnection): PdoConnectionI {
        return new MysqlConnection(connection);
    }

    protected async closeConnection(connection: mysqlPoolConnection): Promise<void> {
        await connection.end();
        connection.removeAllListeners();
    }

    protected async destroyConnection(connection: mysqlPoolConnection): Promise<void> {
        // get new connection to force kill pending
        const newConn = await this.createConnection();
        await newConn.query('KILL QUERY ' + connection.threadId);
        await newConn.end();
        await connection.end();
        connection.removeAllListeners();
    }

    protected validateRawConnection(connection: protectedMysqlConnection): boolean {
        return (
            connection != null &&
            !connection._fatalError &&
            !connection._protocolError &&
            !connection._closing &&
            (connection.stream == null || !connection.stream.destroyed)
        );
    }

    public getRawConnection(): PdoRawConnectionI {
        return new MysqlRawConnection(this.pool);
    }
}

export default MysqlDriver;
