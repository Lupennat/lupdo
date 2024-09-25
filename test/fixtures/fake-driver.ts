import {
  PdoAttributes,
  PdoConnectionI,
  PdoPoolOptions,
  PdoRawConnectionI,
} from '../../src';
import { ATTR_DEBUG, DEBUG_ENABLED } from '../../src/constants';
import PdoDriver from '../../src/support/pdo-driver';
import FakeConnection from './fake-connection';
import JsonConnection from './fake-db-connection';
import FakeRawConnection from './fake-raw-connection';

export interface FakeDriverOptions {
  [key: string]: any;
}

export default class FakeDriver extends PdoDriver {
  protected driverAttributes: PdoAttributes = {
    FAKE_DRIVER_ATTRS: 10,
  };

  constructor(
    driver: string,
    protected options: FakeDriverOptions,
    poolOptions: PdoPoolOptions,
    attributes: PdoAttributes,
  ) {
    super(driver, poolOptions, attributes);
  }

  protected async createConnection(unsecure = false): Promise<JsonConnection> {
    const debugMode = this.getAttribute(ATTR_DEBUG) as number;

    return new JsonConnection({
      ...this.options,
      ...(unsecure ? {} : { notSafe: false }),
      debug: debugMode === DEBUG_ENABLED,
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

  protected async getVersionFromConnection(): Promise<string> {
    return '1.0.0-fake';
  }

  protected validateRawConnection(): boolean {
    return true;
  }

  public getRawConnection(): PdoRawConnectionI {
    return new FakeRawConnection(this.pool);
  }
}
