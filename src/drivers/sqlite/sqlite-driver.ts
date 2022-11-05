import Database from 'better-sqlite3';
import {
    NpdoPoolOptions,
    NpdoDriver as NpdoDriverI,
    NpdoConnection,
    NpdoAttributes,
    NpdoRawConnection,
    NpdoAvailableDriver
} from '../../types';
import SqliteConnection from './sqlite-connection';
import SqliteRawConnection from './sqlite-raw-connection';

import NpdoDriver from '../npdo-driver';

class SqliteDriver extends NpdoDriver {
    constructor(
        driver: NpdoAvailableDriver,
        protected options: NpdoDriverI.SqliteOptions,
        poolOptions: NpdoPoolOptions,
        attributes: NpdoAttributes
    ) {
        super(driver, poolOptions, attributes);
    }

    protected async createConnection(): Promise<NpdoDriverI.sqlitePoolConnection> {
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

    public getRawConnection(): NpdoRawConnection {
        return new SqliteRawConnection(this.pool);
    }
}

export = SqliteDriver;
