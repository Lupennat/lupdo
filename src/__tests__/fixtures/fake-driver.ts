import { ATTR_DEBUG, DEBUG_ENABLED } from '../../constants';
import { PdoDriver } from '../../support';
import { PdoConnectionI, PdoRawConnectionI } from '../../types';
import PdoAttributes from '../../types/pdo-attributes';
import { PoolOptions } from '../../types/pdo-pool';
import FakeConnection from './fake-connection';
import JsonConnection from './fake-db-connection';
import FakeRawConnection from './fake-raw-connection';

interface FakeDriverOptions {
    [key: string]: any;
}
class FakeDriver extends PdoDriver {
    protected driverAttributes: PdoAttributes = {
        FAKE_DRIVER_ATTRS: 10
    };

    constructor(
        driver: string,
        protected options: FakeDriverOptions,
        poolOptions: PoolOptions,
        attributes: PdoAttributes
    ) {
        super(driver, poolOptions, attributes);
    }

    protected async createConnection(unsecure = false): Promise<JsonConnection> {
        const debugMode = this.getAttribute(ATTR_DEBUG) as number;

        return new JsonConnection({
            ...this.options,
            ...(unsecure ? {} : { notSafe: false }),
            debug: debugMode === DEBUG_ENABLED
        });
    }

    protected createPdoConnection(connection: JsonConnection): PdoConnectionI {
        return new FakeConnection(connection);
    }

    protected async closeConnection(connection: JsonConnection): Promise<void> {
        await connection.end();
    }

    protected async destroyConnection(connection: JsonConnection): Promise<void> {
        // get new connection to force kill pending
        const newConn = await this.createConnection();
        await newConn.query('KILL QUERY ' + connection.threadId);
        await newConn.end();
        await connection.end();
    }

    protected validateRawConnection(): boolean {
        return true;
    }

    public getRawConnection(): PdoRawConnectionI {
        return new FakeRawConnection(this.pool);
    }
}

export default FakeDriver;
