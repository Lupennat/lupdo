import { Pool } from 'tarn';
import { PoolOptions } from 'tarn/dist/Pool';
import {
    NpdoPoolOptions,
    NpdoDriver as NpdoDriverI,
    NpdoConnection,
    NpdoStatement,
    NpdoTransaction,
    NpdoPreparedStatement
} from '../types';

import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'node:events';

abstract class NpdoDriver extends EventEmitter implements NpdoDriverI {
    protected pool: Pool<NpdoDriverI.PoolConnection>;

    constructor(poolOptions: NpdoPoolOptions) {
        super();
        const { created, destroyed, acquired, released, ...otherOptions } = poolOptions;
        const tarnPoolOptions: PoolOptions<NpdoDriverI.PoolConnection> = {
            create: async (): Promise<NpdoDriverI.PoolConnection> => {
                const connection = await this.createRawConnection();
                const uuid = uuidv4();

                if (typeof created === 'function') {
                    try {
                        await created(uuid, this.createNpdoConnection(connection));
                    } catch (error) {
                        this.emit('log', 'error', error);
                    }
                }
                connection.__npdo_uuid = uuid;
                return connection;
            },
            destroy: async (connection: NpdoDriverI.PoolConnection) => {
                const uuid: string = connection.__npdo_uuid;
                await this.destroyConnection(connection);
                if (typeof destroyed === 'function') {
                    try {
                        await destroyed(uuid);
                    } catch (error) {
                        this.emit('log', 'error', error);
                    }
                }
            },
            ...otherOptions
        };

        this.pool = new Pool<NpdoDriverI.PoolConnection>(tarnPoolOptions);

        this.pool.on('acquireSuccess', (eventId: number, connection: NpdoDriverI.PoolConnection) => {
            if (typeof acquired === 'function') {
                acquired(connection.__npdo_uuid);
            }
        });

        this.pool.on('release', (connection: NpdoDriverI.PoolConnection) => {
            if (typeof released === 'function') {
                released(connection.__npdo_uuid);
            }
        });
    }

    protected abstract createRawConnection(): Promise<NpdoDriverI.PoolConnection>;
    protected abstract destroyConnection(connection: NpdoDriverI.PoolConnection): Promise<void>;
    protected abstract createNpdoConnection(connection: NpdoDriverI.PoolConnection): NpdoConnection;

    public abstract beginTransaction(): Promise<NpdoTransaction>;
    public abstract disconnect(): Promise<void>;

    public abstract prepare(sql: string): Promise<NpdoPreparedStatement>;

    public abstract query(
        sql: string,
        fetchMode?: number,
        columnOrFnOrObject?: number | Function | object,
        constructorArgs?: any[]
    ): Promise<NpdoStatement>;
}

export = NpdoDriver;
