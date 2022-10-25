import { Pdo } from '../@types/index';
import * as C from './constants';
import MysqlDriver from './drivers/mysql/mysql-driver';

class NodePdo implements Pdo {
    protected driver: Pdo.Driver;

    protected static availableDrivers: Pdo.Drivers = {
        mysql: MysqlDriver
    };

    static getAvailableDrivers(): string[] {
        return Object.keys(NodePdo.availableDrivers);
    }

    constructor(
        driver: Pdo.availableDrivers,
        options: Pdo.Driver.Options,
        connectCallback: Pdo.ConnectCallbackFunction | null = null
    ) {
        this.driver = new NodePdo.availableDrivers[driver](options, connectCallback);
    }

    public async beginTransaction(): Promise<Pdo.Transaction> {
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

    public async prepare(sql: string): Promise<Pdo.PreparedStatement> {
        const statement = await this.driver.prepare(sql);
        return statement;
    }

    public async query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<Pdo.Statement> {
        const statement = await this.driver.query(sql, fetchMode, columnOrFnOrObject, constructorArgs);
        return statement;
    }
}

Object.assign(NodePdo, C);

export = NodePdo;
