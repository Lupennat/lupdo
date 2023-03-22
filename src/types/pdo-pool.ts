import { Pool as TarnPool, PoolOptions as TarnPoolOptions } from 'tarn/dist/Pool';
import PdoConnectionI from './pdo-connection';

export interface InternalPdoPoolOptions<T> extends TarnPoolOptions<T> {
    killResource?: boolean;
    killTimeoutMillis?: number;
    kill: (resource: T) => any;
}

export interface PoolOptions {
    /**
     * minimum pool size
     *
     * [Default = 2]
     */
    min?: number;
    /**
     * maximum pool size
     *
     * [Default = 10]
     */
    max?: number;
    /**
     * acquire promises are rejected after this many milliseconds
     * if a resource cannot be acquired
     *
     * [Default 10000]
     */
    acquireTimeoutMillis?: number;
    /**
     * create operations are cancelled after this many milliseconds
     * if a resource cannot be acquired
     *
     * [Default 5000]
     */
    createTimeoutMillis?: number;
    /**
     * destroy operations are awaited for at most this many milliseconds
     * new resources will be created after this timeout
     *
     * [Default 5000],
     */
    destroyTimeoutMillis?: number;
    /**
     * when pool destroy is executed
     * connection will be released and brutaly killed after this timeut
     *
     * [Default 10000].
     */
    killTimeoutMillis?: number;
    /**
     * enable/disable killTimeout
     *
     * [Default false]
     */
    killResource?: boolean;
    /**
     * Free resources are destroyed after this many milliseconds.
     * Note that if min > 0, some resources may be kept alive for longer.
     * To reliably destroy all idle resources, set min to 0.
     *
     * [Default 30000]
     */
    idleTimeoutMillis?: number;
    /**
     * how long to idle after failed create before trying again
     *
     * [Default 200]
     */
    createRetryIntervalMillis?: number;
    /**
     * how often to check for idle resources to destroy
     *
     * [Default 500]
     */
    reapIntervalMillis?: number;
    /**
     * Define Custom Created Callback.
     * Error on Created Callback will be logged and not raised
     */
    created?: (uuid: string, connection: PdoConnectionI) => Promise<void> | void;
    /**
     * Define Custom Destroyed Callback.
     * Error on Destroyed Callback will be logged and not raised
     */
    destroyed?: (uuid: string) => Promise<void> | void;
    /**
     * Define Custom Acquired Callback.
     */
    acquired?: (uuid: string, eventId: number) => void;
    /**
     * Define Custom Release Callback.
     */
    released?: (uuid: string) => void;
    /**
     * Define Custom Kill Callback.
     */
    killed?: (uuid: string) => void;
}

export interface PoolConnection {
    __lupdo_uuid: string;
    __lupdo_killed: boolean;
    [key: string]: any;
}

export interface RawPoolConnection {
    release: () => Promise<void>;
    connection: PoolConnection;
}

export type PoolI<T> = TarnPool<T>;
