import {
    FetchFunctionClosure,
    NpdoAttributes,
    NpdoAvailableDriver,
    NpdoDriver,
    NpdoLogger,
    NpdoPoolOptions,
    NpdoPreparedStatement,
    NpdoStatement,
    NpdoTransaction
} from './types';

import MysqlDriver from './drivers/mysql/mysql-driver';
import NpdoConstants from './constants';
import NpdoError from './npdo-error';
import SqliteDriver from './drivers/sqlite/sqlite-driver';

class Npdo extends NpdoConstants {
    protected driver: NpdoDriver;
    protected static logger: NpdoLogger = (message: any, level: any): void => {};

    protected static availableDrivers: NpdoAvailableDriver[] = ['mysql', 'mariadb', 'sqlite', 'sqlite3'];

    static setLogger(logger: NpdoLogger): void {
        Npdo.logger = logger;
    }

    static getAvailableDrivers(): string[] {
        return Npdo.availableDrivers;
    }

    constructor(
        driver: NpdoAvailableDriver,
        options: NpdoDriver.Options,
        poolOptions: NpdoPoolOptions = {},
        attributes: NpdoAttributes = {}
    ) {
        super();
        switch (driver as string) {
            case 'mysql':
            case 'mariadb':
                this.driver = new MysqlDriver(driver, options as NpdoDriver.MysqlOptions, poolOptions, attributes);
                break;
            case 'sqlite':
            case 'sqlite3':
                this.driver = new SqliteDriver(driver, options as NpdoDriver.SqliteOptions, poolOptions, attributes);
                break;
            default:
                throw new NpdoError(`Driver [${driver}] not available.`);
        }
        this.driver.on('log', (level: string, message: string) => {
            Npdo.logger(level, message);
        });
    }

    public async beginTransaction(): Promise<NpdoTransaction> {
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

    public async prepare(sql: string): Promise<NpdoPreparedStatement> {
        const statement = await this.driver.prepare(sql);
        return statement;
    }

    public async query(
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatement> {
        const statement = await this.driver.query(sql, fetchMode, numberOrClassOrFnOrObject, constructorArgs);
        return statement;
    }

    public getAttribute(attribute: string): string | number {
        return this.driver.getAttribute(attribute);
    }

    public setAttribute(attribute: string, value: number | string): boolean {
        return this.driver.setAttribute(attribute, value);
    }
}

export = Npdo;
