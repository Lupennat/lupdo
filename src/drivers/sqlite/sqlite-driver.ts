import Database from 'better-sqlite3';

import SqliteConnection from './sqlite-connection';
import SqliteRawConnection from './sqlite-raw-connection';

import { ATTR_DEBUG, DEBUG_ENABLED } from '../../constants';
import { PdoAvailableDriver } from '../../types/pdo';
import PdoAttributes from '../../types/pdo-attributes';
import PdoConnectionI from '../../types/pdo-connection';
import { SqliteOptions } from '../../types/pdo-driver';
import { PoolOptions, sqlitePoolConnection } from '../../types/pdo-pool';
import PdoRawConnectionI from '../../types/pdo-raw-connection';
import PdoDriver from '../pdo-driver';

export interface SqliteAggregateOptions extends Database.AggregateOptions {
    start?: number | (() => number);
}

export interface SqliteFunctionOptions extends Database.RegistrationOptions {
    execute: (...params: any[]) => any;
}

class SqliteDriver extends PdoDriver {
    protected static aggregateFunctions: {
        [key: string]: SqliteAggregateOptions;
    };

    protected static functions: {
        [key: string]: SqliteFunctionOptions;
    };

    constructor(
        driver: PdoAvailableDriver,
        protected options: SqliteOptions,
        poolOptions: PoolOptions,
        attributes: PdoAttributes
    ) {
        super(driver, poolOptions, attributes);
    }

    protected async createConnection(): Promise<sqlitePoolConnection> {
        const { path, ...sqliteOptions } = this.options;
        const debugMode = this.getAttribute(ATTR_DEBUG) as number;
        if ((debugMode & DEBUG_ENABLED) !== 0) {
            const customVerbose = sqliteOptions.verbose;
            sqliteOptions.verbose = (...args) => {
                if (typeof customVerbose === 'function') {
                    customVerbose.call(customVerbose, ...args);
                }
                console.log(...args);
            };
        }
        const db = new Database(path, sqliteOptions);

        for (const name in SqliteDriver.aggregateFunctions) {
            db.aggregate(name, SqliteDriver.aggregateFunctions[name]);
        }

        for (const name in SqliteDriver.functions) {
            const opts = SqliteDriver.functions[name];
            const { execute, ...options } = opts;

            db.function(name, options, execute);
        }

        return db as sqlitePoolConnection;
    }

    protected createPdoConnection(connection: sqlitePoolConnection): PdoConnectionI {
        return new SqliteConnection(connection);
    }

    protected async closeConnection(connection: sqlitePoolConnection): Promise<void> {
        await connection.close();
    }

    protected async destroyConnection(connection: sqlitePoolConnection): Promise<void> {
        connection.close();
    }

    protected validateRawConnection(): boolean {
        return true;
    }

    public getRawConnection(): PdoRawConnectionI {
        return new SqliteRawConnection(this.pool);
    }

    /**
     * https://sqlite.org/lang_aggfunc.html
     * @param name
     * @param options https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#aggregatename-options---this
     */
    public static createAggregate(name: string, options: SqliteAggregateOptions): void {
        SqliteDriver.aggregateFunctions[name] = options;
    }

    /**
     *
     * @param name
     * @param options https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#functionname-options-function---this
     */
    public static createFunction(name: string, options: SqliteFunctionOptions): void {
        SqliteDriver.functions[name] = options;
    }
}

export default SqliteDriver;
