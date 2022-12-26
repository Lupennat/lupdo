import { PdoError } from './errors';
import PdoI, { PdoLogger } from './types/pdo';
import PdoAttributes from './types/pdo-attributes';
import PdoDriverI, { PdoDriverConstructor } from './types/pdo-driver';
import { PoolOptions, RawPoolConnection } from './types/pdo-pool';
import PdoPreparedStatementI from './types/pdo-prepared-statement';
import PdoStatementI from './types/pdo-statement';
import PdoTransactionI from './types/pdo-transaction';

class Pdo implements PdoI {
    protected driver: PdoDriverI;

    protected static logger: PdoLogger = (): void => {
        return void 0;
    };

    protected static availableDrivers: { [key: string]: PdoDriverConstructor } = {};

    static setLogger(logger: PdoLogger): void {
        Pdo.logger = logger;
    }

    static getAvailableDrivers(): string[] {
        return Object.keys(Pdo.availableDrivers);
    }

    static addDriver(driverName: string, driver: PdoDriverConstructor): void {
        if (!(driverName in Pdo.availableDrivers)) {
            Pdo.availableDrivers[driverName] = driver;
        }
    }

    constructor(
        protected driverName: string,
        options: any,
        poolOptions: PoolOptions = {},
        attributes: PdoAttributes = {}
    ) {
        if (!(driverName in Pdo.availableDrivers)) {
            throw new PdoError(`Driver [${driverName}] not available.`);
        }
        this.driver = new Pdo.availableDrivers[driverName](driverName, options, poolOptions, attributes);

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

    public reconnect(): void {
        this.driver.reconnect();
    }

    public async exec(sql: string): Promise<number> {
        return await this.driver.exec(sql);
    }

    public async prepare(sql: string): Promise<PdoPreparedStatementI> {
        const statement = await this.driver.prepare(sql);
        return statement;
    }

    public async query(sql: string): Promise<PdoStatementI> {
        const statement = await this.driver.query(sql);
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
