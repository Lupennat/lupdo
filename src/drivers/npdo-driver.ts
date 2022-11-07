import {
    InternalNpdoPoolOptions,
    NpdoPoolOptions,
    NpdoDriver as NpdoDriverI,
    NpdoTransaction as NpdoTransactionI,
    NpdoPreparedStatement as NpdoPreparedStatementI,
    NpdoStatement as NpdoStatementI,
    NpdoRawConnection as NpdoRawConnectionI,
    NpdoConnection as NpdoConnectionI,
    NpdoAttributes,
    FetchFunctionClosure,
    NpdoAvailableDriver,
    NpdoPool as NpdoPoolI
} from '../types';

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'node:events';
import NpdoConstants from '../constants';
import NpdoTransaction from './npdo-transaction';
import NpdoPreparedStatement from './npdo-prepared-statement';
import NpdoStatement from './npdo-statement';
import NpdoPool from './npdo-pool';

abstract class NpdoDriver extends EventEmitter implements NpdoDriverI {
    protected instances: NpdoDriverI.instances = {
        transaction: NpdoTransaction,
        preparedStatement: NpdoPreparedStatement,
        statement: NpdoStatement
    };

    protected attributes: NpdoAttributes = {
        [NpdoConstants.ATTR_CASE]: NpdoConstants.CASE_NATURAL,
        [NpdoConstants.ATTR_DEFAULT_FETCH_MODE]: NpdoConstants.FETCH_NUM,
        [NpdoConstants.ATTR_NULLS]: NpdoConstants.NULL_NATURAL,
        [NpdoConstants.ATTR_DEBUG]: NpdoConstants.DEBUG_DISABLED
    };

    protected pool: NpdoPoolI<NpdoDriverI.PoolConnection>;

    constructor(driver: NpdoAvailableDriver, poolOptions: NpdoPoolOptions, attributes: NpdoAttributes) {
        super();
        Object.assign(this.attributes, attributes, {
            [NpdoConstants.ATTR_DRIVER_NAME]: driver
        });
        const { created, destroyed, acquired, released, killed, ...otherOptions } = poolOptions;
        const debugMode = this.getAttribute(NpdoConstants.ATTR_DEBUG) as number;
        const hasDebug = (debugMode & NpdoConstants.DEBUG_ENABLED) !== 0;
        const npdoPoolOptions: InternalNpdoPoolOptions<NpdoDriverI.PoolConnection> = {
            min: 2,
            max: 10,
            acquireTimeoutMillis: 10000,
            createTimeoutMillis: 5000,
            ...otherOptions,
            propagateCreateError: false,
            validate: (connection: NpdoDriverI.PoolConnection) => {
                return this.validateRawConnection(connection);
            },
            create: async (): Promise<NpdoDriverI.PoolConnection> => {
                const connection = await this.createConnection();
                const uuid = uuidv4();

                if (typeof created === 'function') {
                    await created(uuid, this.createNpdoConnection(connection));
                }
                connection.__npdo_uuid = uuid;

                if (hasDebug) {
                    console.log(`Npdo Pool Resource Created: ${connection.__npdo_uuid}`);
                }

                return connection;
            },
            kill: (connection: NpdoDriverI.PoolConnection) => {
                if (connection !== undefined) {
                    if (typeof killed === 'function') {
                        killed(connection.__npdo_uuid);
                    }

                    if (hasDebug) {
                        console.log(`Npdo Pool Resource Killed: ${connection.__npdo_uuid}`);
                    }
                }
            },
            destroy: async (connection: NpdoDriverI.PoolConnection) => {
                if (connection !== undefined) {
                    const uuid: string = connection.__npdo_uuid;
                    await this.destroyConnection(connection);

                    if (typeof destroyed === 'function') {
                        await destroyed(uuid);
                    }

                    if (hasDebug) {
                        console.log(`Npdo Pool Resource Destroyed: ${connection.__npdo_uuid}`);
                    }
                }
            },
            log: (message: any, logLevel?: any): void => {
                logLevel = logLevel != null ? (logLevel === 'warn' ? 'warning' : logLevel) : 'debug';
                this.emit('log', message, logLevel);
            }
        };

        this.pool = new NpdoPool<NpdoDriverI.PoolConnection>(npdoPoolOptions);

        this.pool.on('acquireSuccess', (eventId: number, connection: NpdoDriverI.PoolConnection) => {
            if (typeof acquired === 'function') {
                acquired(connection.__npdo_uuid);
            }

            if (hasDebug) {
                console.log(`Npdo Pool Resource Acquired: ${connection.__npdo_uuid}`);
            }
        });

        this.pool.on('release', (connection: NpdoDriverI.PoolConnection) => {
            if (typeof released === 'function') {
                released(connection.__npdo_uuid);
            }

            if (hasDebug) {
                console.log(`Npdo Pool Resource Released: ${connection.__npdo_uuid}`);
            }
        });
    }

    protected abstract createConnection(): Promise<NpdoDriverI.PoolConnection>;
    protected abstract getRawConnection(): NpdoRawConnectionI;
    protected abstract destroyConnection(connection: NpdoDriverI.PoolConnection): Promise<void>;
    protected abstract createNpdoConnection(connection: NpdoDriverI.PoolConnection): NpdoConnectionI;

    protected validateRawConnection(connection: NpdoDriverI.PoolConnection): boolean {
        return true;
    }

    public async disconnect(): Promise<void> {
        await this.pool.destroy();
        this.pool.removeAllListeners('acquireSuccess');
        this.pool.removeAllListeners('release');
    }

    public async beginTransaction(): Promise<NpdoTransactionI> {
        const connection = this.getRawConnection();
        await connection.beginTransaction();
        return new NpdoTransaction(connection, this.attributes);
    }

    public async prepare(sql: string, attributes: NpdoAttributes = {}): Promise<NpdoPreparedStatementI> {
        const connection = this.getRawConnection();
        await connection.prepare(sql);
        return new NpdoPreparedStatement(connection, Object.assign({}, this.attributes, attributes));
    }

    public async query(
        sql: string,
        fetchMode?: number,
        numberOrClassOrFnOrObject?: number | FetchFunctionClosure | FunctionConstructor | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatementI> {
        const connection = this.getRawConnection();
        await connection.query(sql);
        return new NpdoStatement(connection, this.attributes, fetchMode, numberOrClassOrFnOrObject, constructorArgs);
    }

    public getAttribute(attribute: string): string | number {
        return this.attributes[attribute];
    }

    public setAttribute(attribute: string, value: number | string): boolean {
        if (attribute in this.attributes) {
            this.attributes[attribute] = value;
            return true;
        }
        return false;
    }
}

export = NpdoDriver;
