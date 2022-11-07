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
import MysqlTransaction from './mysql-transaction';
import NpdoConstants from '../../constants';

class MysqlDriver extends NpdoDriver {
    constructor(
        driver: NpdoAvailableDriver,
        protected options: NpdoDriverI.MysqlOptions,
        poolOptions: NpdoPoolOptions,
        attributes: NpdoAttributes
    ) {
        super(driver, poolOptions, attributes);
        this.instances.transaction = MysqlTransaction;
    }

    protected async createConnection(): Promise<NpdoDriverI.mysqlPoolConnection> {
        const { hosts, queryFormat, ...mysqlOptions } = this.options;
        const debugMode = this.getAttribute(NpdoConstants.ATTR_DEBUG) as number;
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
            supportBigNumbers: true,
            debug: (debugMode & NpdoConstants.DEBUG_ENABLED) !== 0
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
