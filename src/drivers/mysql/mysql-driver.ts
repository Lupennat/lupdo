import { createConnection } from 'mysql2/promise';
import {
    NpdoPoolOptions,
    NpdoDriver as NpdoDriverI,
    NpdoConnection,
    NpdoAttributes,
    NpdoRawConnection,
    NpdoAvailableDriver
} from '../../types';

import MysqlConnection from './mysql-connection';
import MysqlRawConnection from './mysql-raw-connection';
import shuffle from 'lodash.shuffle';
import NpdoDriver from '../npdo-driver';

class MysqlDriver extends NpdoDriver {
    constructor(
        driver: NpdoAvailableDriver,
        protected options: NpdoDriverI.MysqlOptions,
        poolOptions: NpdoPoolOptions,
        attributes: NpdoAttributes
    ) {
        super(driver, poolOptions, attributes);
    }

    protected async createConnection(): Promise<NpdoDriverI.mysqlPoolConnection> {
        const { hosts, queryFormat, ...mysqlOptions } = this.options;
        if (hosts != null) {
            const randomHost = shuffle<string>(hosts)[0];
            const [host, port] = randomHost.split(':') as [string, string | undefined];
            mysqlOptions.host = host;
            if (port != null && !isNaN(Number(port))) {
                mysqlOptions.port = Number(port);
            }
        }

        return (await createConnection({
            ...mysqlOptions,
            rowsAsArray: true,
            namedPlaceholders: true,
            dateStrings: false,
            supportBigNumbers: true
        })) as NpdoDriverI.mysqlPoolConnection;
    }

    protected createNpdoConnection(connection: NpdoDriverI.mysqlPoolConnection): NpdoConnection {
        return new MysqlConnection(connection);
    }

    protected async destroyConnection(connection: NpdoDriverI.mysqlPoolConnection): Promise<void> {
        await connection.end();
        connection.removeAllListeners();
    }

    public getRawConnection(): NpdoRawConnection {
        return new MysqlRawConnection(this.pool);
    }
}

export = MysqlDriver;
