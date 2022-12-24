# WRITE CUSTOM DRIVER

Custom Lupdo Driver must implements a sql syntax; only string can be used to perform query against a database.


## FULL EXAMPLE

```ts

import {
    ATTR_DEBUG,
    DEBUG_ENABLED,
    Pdo,
    PdoConnection,
    PdoConnectionI,
    PdoDriver,
    PdoRawConnection,
    PdoRawConnectionI
} from 'lupdo';
import PdoAffectingData from 'lupdo/dist/typings/types/pdo-affecting-data';
import PdoAttributes from 'lupdo/dist/typings/types/pdo-attributes';
import PdoColumnData from 'lupdo/dist/typings/types/pdo-column-data';
import { DriverOptions } from 'lupdo/dist/typings/types/pdo-driver';
import { PoolConnection, PoolOptions } from 'lupdo/dist/typings/types/pdo-pool';
import { ValidBindings } from 'lupdo/dist/typings/types/pdo-prepared-statement';
import PdoRowData from 'lupdo/dist/typings/types/pdo-raw-data';

interface ThirdPartyConnectionOptions extends DriverOptions {
    [key: string]: any;
}

class ThirdPartyConnectionToDB implements PoolConnection {
    // __lupdo_xxx property are used internally from lupdo
    // should be defined like this
    __lupdo_uuid = '';
    __lupdo_killed = false;
    constructor(public options: ThirdPartyConnectionOptions) {}
}

class ThirdPartyStatement {}

// FakeConnection should be used only to set session variables on the connection before it gets used.
class FakeConnection extends PdoConnection {
    constructor(public readonly connection: ThirdPartyConnectionToDB) {
        super();
    }

    async query(sql: string): Promise<void> {
        // execute third party query
    }
}

class FakeRawConnection extends PdoRawConnection {
    protected async doBeginTransaction(connection: ThirdPartyConnectionToDB): Promise<void> {
        // exec third party connection begin transaction
    }

    protected async doCommit(connection: ThirdPartyConnectionToDB): Promise<void> {
        // exec third party connection commit
    }

    protected async doRollback(connection: ThirdPartyConnectionToDB): Promise<void> {
        // exec third party connection rollback
    }

    protected async getStatement(sql: string, connection: ThirdPartyConnectionToDB): Promise<ThirdPartyStatement> {
        // return third party connection statement
        return new ThirdPartyStatement();
    }

    protected async executeStatement(
        statement: ThirdPartyStatement,
        bindings: string[] | { [key: string]: string },
        connection: ThirdPartyConnectionToDB
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        // return adapted data from third party statement execution
        return [{}, [], []];
    }

    protected async closeStatement(
        statement: ThirdPartyStatement,
        connection: ThirdPartyConnectionToDB
    ): Promise<void> {
        // close third party statement
    }

    protected async doQuery(
        connection: ThirdPartyConnectionToDB,
        sql: string
    ): Promise<[PdoAffectingData, PdoRowData[], PdoColumnData[]]> {
        // return adapted data from third party query execution
        return [{}, [], []];
    }

    protected adaptBindValue(value: ValidBindings): ValidBindings {
        // adapt parameter bindings before execute third party statement
        return value;
    }
}

class FakeDriver extends PdoDriver {
    constructor(driver: string, protected options: ThirdPartyConnectionOptions, poolOptions: PoolOptions, attributes: PdoAttributes) {
        super(driver, poolOptions, attributes);
    }

    protected async createConnection(): Promise<ThirdPartyConnectionToDB> {
        const { ...thirdPartyOptions } = this.options;
        // debugmode must be enabled only through ATTR_DEBUG
        const debugMode = this.getAttribute(ATTR_DEBUG) as number;

        return new ThirdPartyConnectionToDB({
            ...thirdPartyOptions,
            debug: debugMode === DEBUG_ENABLED
        });
    }

    protected createPdoConnection(connection: ThirdPartyConnectionToDB): PdoConnectionI {
        // return new PdoConnection
        // it should be a basic connection that can execute only not prepared sql
        // it should be used only to set session variables on the third party connection before it gets used.

        return new FakeConnection(connection);
    }

    protected async closeConnection(connection: ThirdPartyConnectionToDB): Promise<void> {
        // close connection
    }

    protected async destroyConnection(connection: ThirdPartyConnectionToDB): Promise<void> {
        // if available get new connection to force kill pending connection
    }

    protected validateRawConnection(): boolean {
        // validate third party connection before will be used by the pool
        return true;
    }

    public getRawConnection(): PdoRawConnectionI {
        return new FakeRawConnection(this.pool);
    }
}

Pdo.addDriver('fake', FakeDriver);
```