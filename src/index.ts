import { NpdoDriver, NpdoDrivers, NpdoPreparedStatement, NpdoStatement, NpdoTransaction } from './types';

import MysqlDriver from './drivers/mysql/mysql-driver';
import NpdoConstants from './constants';
class Npdo extends NpdoConstants {
    protected driver: NpdoDriver;

    protected static availableDrivers: NpdoDrivers = {
        mysql: MysqlDriver
    };

    static getAvailableDrivers(): string[] {
        return Object.keys(Npdo.availableDrivers);
    }

    constructor(driver: NpdoDriver.Available, options: NpdoDriver.Options) {
        super();
        this.driver = new Npdo.availableDrivers[driver](options);
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
