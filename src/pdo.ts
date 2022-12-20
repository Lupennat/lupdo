import MysqlDriver from './drivers/mysql/mysql-driver';
import SqliteDriver from './drivers/sqlite/sqlite-driver';
import PdoError from './errors/pdo-error';
import PdoI, { PdoAvailableDriver, PdoLogger } from './types/pdo';
import PdoAttributes from './types/pdo-attributes';
import PdoDriverI, { DriverOptions, MysqlOptions, SqliteOptions } from './types/pdo-driver';
import { FetchFunctionClosure } from './types/pdo-fetch';
import { PoolOptions, RawPoolConnection } from './types/pdo-pool';
import PdoPreparedStatementI from './types/pdo-prepared-statement';
import PdoStatementI from './types/pdo-statement';
import PdoTransactionI from './types/pdo-transaction';

class Pdo implements PdoI {
    protected driver: PdoDriverI;
    protected static logger: PdoLogger = (): void => {
        return void 0;
    };

    protected static availableDrivers: PdoAvailableDriver[] = ['mysql', 'mariadb', 'sqlite', 'sqlite3'];

    static setLogger(logger: PdoLogger): void {
        Pdo.logger = logger;
    }

    static getAvailableDrivers(): PdoAvailableDriver[] {
        return Pdo.availableDrivers;
    }

    constructor(
        protected driverName: PdoAvailableDriver,
        options: DriverOptions,
        poolOptions: PoolOptions = {},
        attributes: PdoAttributes = {}
    ) {
        switch (driverName as string) {
            case 'mysql':
            case 'mariadb':
                this.driver = new MysqlDriver(driverName, options as MysqlOptions, poolOptions, attributes);
                break;
            case 'sqlite':
            case 'sqlite3':
                this.driver = new SqliteDriver(driverName, options as SqliteOptions, poolOptions, attributes);
                break;
            default:
                throw new PdoError(`Driver [${driverName}] not available.`);
        }
        this.driver.on('log', (level: string, message: string) => {
            Pdo.logger(level, message);
        });
    }

    public async beginTransaction(): Promise<PdoTransactionI> {
        const transaction = await this.driver.beginTransaction();
        return transaction;
    }

    public async disconnect(): Promise<void> {
        await this.driver.disconnect();
    }

    public async exec(sql: string): Promise<number> {
        const statement = await this.query(sql);
        return statement.rowCount();
    }

    public async prepare(sql: string): Promise<PdoPreparedStatementI> {
        const statement = await this.driver.prepare(sql);
        return statement;
    }

    public async query(
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ): Promise<PdoStatementI> {
        const statement = await this.driver.query(sql, fetchMode, numberOrClassOrFnOrObject, constructorArgs);
        return statement;
    }

    public async getRawPoolConnection(): Promise<RawPoolConnection> {
        return await this.driver.getRawPoolConnection();
    }

    public getAttribute(attribute: string): string | number {
        return this.driver.getAttribute(attribute);
    }

    public setAttribute(attribute: string, value: number | string): boolean {
        return this.driver.setAttribute(attribute, value);
    }
}

export default Pdo;
