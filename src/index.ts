import {
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

    static getAvailableDrivers(): NpdoAvailableDriver[] {
        return Npdo.availableDrivers;
    }

    constructor(
        driver: NpdoAvailableDriver,
        options: NpdoDriver.Options,
        poolOptions: NpdoPoolOptions = { min: 2, max: 10 }
    ) {
        super();
        switch (driver.toLowerCase()) {
            case 'mysql':
            case 'mariadb':
                this.driver = new MysqlDriver(options as NpdoDriver.MysqlOptions, poolOptions);
                break;
            case 'sqlite':
            case 'sqlite3':
                this.driver = new SqliteDriver(options as NpdoDriver.SqliteOptions, poolOptions);
                break;
            default:
                throw new NpdoError(`driver "${driver}" not available`);
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
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatement> {
        const statement = await this.driver.query(sql, fetchMode, columnOrFnOrObject, constructorArgs);
        return statement;
    }
}

export = Npdo;
