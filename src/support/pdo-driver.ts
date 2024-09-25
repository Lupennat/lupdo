import { EventEmitter } from 'node:events';

import { v4 as uuidv4 } from 'uuid';

import {
  ATTR_CASE,
  ATTR_DEBUG,
  ATTR_DRIVER_NAME,
  ATTR_FETCH_DIRECTION,
  ATTR_NULLS,
  CASE_NATURAL,
  DEBUG_DISABLED,
  DEBUG_ENABLED,
  FETCH_FORWARD,
  NULL_NATURAL,
} from '../constants';
import PdoError from '../errors/pdo-error';
import { PdoAttributes } from '../types/pdo-attributes';
import { PdoConnectionI } from '../types/pdo-connection';
import { DriverInstances, PdoDriverI } from '../types/pdo-driver';
import {
  InternalPdoPoolOptions,
  PdoPoolOptions,
  PoolConnection,
  PoolI,
  RawPoolConnection,
} from '../types/pdo-pool';
import { PdoPreparedStatementI } from '../types/pdo-prepared-statement';
import { PdoRawConnectionI } from '../types/pdo-raw-connection';
import { PdoStatementI } from '../types/pdo-statement';
import { PdoTransactionI } from '../types/pdo-transaction';
import PdoPool from './pdo-pool';
import PdoPreparedStatement from './pdo-prepared-statement';
import PdoStatement from './pdo-statement';
import PdoTransaction from './pdo-transaction';

export abstract class PdoDriver extends EventEmitter implements PdoDriverI {
  protected version: string | undefined;
  protected instances: DriverInstances = {
    transaction: PdoTransaction,
    preparedStatement: PdoPreparedStatement,
    statement: PdoStatement,
  };

  protected defaultAttributes: PdoAttributes = {
    [ATTR_FETCH_DIRECTION]: FETCH_FORWARD,
    [ATTR_CASE]: CASE_NATURAL,
    [ATTR_NULLS]: NULL_NATURAL,
    [ATTR_DEBUG]: DEBUG_DISABLED,
  };

  protected driverAttributes: PdoAttributes = {};

  private userAttributes: PdoAttributes;
  private processedAttributes: PdoAttributes | null = null;

  private userPoolOptions: PdoPoolOptions;
  private processedPoolOptions: InternalPdoPoolOptions<PoolConnection> | null =
    null;
  private poolEvents: { [key: string]: Function | undefined } = {};

  protected hasDebug = false;

  private initializedPool: PoolI<PoolConnection> | null = null;

  protected disconnected = false;
  protected forceReconnect = false;

  constructor(
    driver: string,
    userPoolOptions: PdoPoolOptions,
    userAttributes: PdoAttributes,
  ) {
    super();
    this.userAttributes = userAttributes;
    const { created, destroyed, acquired, released, killed, ...otherOptions } =
      userPoolOptions;
    this.userPoolOptions = otherOptions;

    this.poolEvents = { created, destroyed, acquired, released, killed };

    Object.assign(this.defaultAttributes, {
      [ATTR_DRIVER_NAME]: driver,
    });
  }

  public reconnect(): void {
    if (this.disconnected) {
      this.initializedPool = new PdoPool<PoolConnection>(this.poolOptions);
      this.assignPoolEvents();
      this.disconnected = false;
    }
  }

  public async disconnect(): Promise<void> {
    await this.pool.destroy();
    this.pool.removeAllListeners('acquireSuccess');
    this.pool.removeAllListeners('release');
    this.disconnected = true;
  }

  protected get poolOptions(): InternalPdoPoolOptions<PoolConnection> {
    if (this.processedPoolOptions === null) {
      this.processedPoolOptions = {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 10000,
        createTimeoutMillis: 5000,
        ...this.userPoolOptions,
        propagateCreateError: false,
        validate: (connection: PoolConnection) => {
          return this.validateRawConnection(connection);
        },
        create: async (): Promise<PoolConnection> => {
          const connection = await this.createConnection();
          const uuid = uuidv4();

          if (this.version === undefined) {
            this.version = await this.getVersionFromConnection(connection);
          }

          if (typeof this.poolEvents.created === 'function') {
            const pdoConnection = this.createPdoConnection(connection);
            pdoConnection.version = this.version;
            await this.poolEvents.created(uuid, pdoConnection);
          }
          connection.__lupdo_uuid = uuid;
          connection.__lupdo_killed = false;

          if (this.hasDebug) {
            console.log(
              `Pdo Pool Resource Created: ${connection.__lupdo_uuid}`,
            );
          }

          return connection;
        },
        kill: async (connection: PoolConnection) => {
          if (connection !== undefined) {
            await this.destroyConnection(connection);
            connection.__lupdo_killed = true;

            if (typeof this.poolEvents.killed === 'function') {
              this.poolEvents.killed(connection.__lupdo_uuid);
            }

            if (this.hasDebug) {
              console.log(
                `Pdo Pool Resource Killed: ${connection.__lupdo_uuid}`,
              );
            }
          }
        },
        destroy: async (connection: PoolConnection) => {
          if (connection !== undefined && !connection.__lupdo_killed) {
            const uuid: string = connection.__lupdo_uuid;

            await this.closeConnection(connection);

            if (typeof this.poolEvents.destroyed === 'function') {
              await this.poolEvents.destroyed(uuid);
            }

            if (this.hasDebug) {
              console.log(
                `Pdo Pool Resource Destroyed: ${connection.__lupdo_uuid}`,
              );
            }
          }
        },
        log: (message: any): void => {
          // tarn always log only 'warn' messages
          this.emit('log', 'warning', message);
        },
      };
    }
    return this.processedPoolOptions;
  }

  protected get attributes(): PdoAttributes {
    if (this.processedAttributes === null) {
      this.processedAttributes = Object.assign(
        {},
        { ...this.defaultAttributes },
        { ...this.driverAttributes },
      );
      for (const key in this.userAttributes) {
        if (key in this.processedAttributes && key !== ATTR_DRIVER_NAME) {
          this.processedAttributes[key] = this.userAttributes[key];
        }
      }
    }

    return this.processedAttributes;
  }

  protected get pool(): PoolI<PoolConnection> {
    if (this.initializedPool === null) {
      this.hasDebug = this.getAttribute(ATTR_DEBUG) === DEBUG_ENABLED;
      this.initializedPool = new PdoPool<PoolConnection>(this.poolOptions);
      this.assignPoolEvents();
    }

    return this.initializedPool;
  }

  public async beginTransaction(): Promise<PdoTransactionI> {
    this.throwIfDisconnected();
    const connection = this.getRawConnection();
    connection.setAttributes(this.attributes);
    await connection.beginTransaction();
    return new this.instances.transaction(connection);
  }

  public async prepare(sql: string): Promise<PdoPreparedStatementI> {
    this.throwIfDisconnected();
    const connection = this.getRawConnection();
    connection.setAttributes(this.attributes);
    return new this.instances.preparedStatement(
      connection,
      sql,
      await connection.prepare(sql),
    );
  }

  public async exec(sql: string): Promise<number> {
    this.throwIfDisconnected();
    const connection = this.getRawConnection();
    connection.setAttributes(this.attributes);
    return await connection.exec(sql);
  }

  public async query(sql: string): Promise<PdoStatementI> {
    this.throwIfDisconnected();
    const connection = this.getRawConnection();
    connection.setAttributes(this.attributes);
    return new this.instances.statement(
      connection,
      sql,
      ...(await connection.query(sql)),
    );
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

  public async getVersion(): Promise<string> {
    if (this.version === undefined) {
      const connection = await this.createConnection();
      this.version = await this.getVersionFromConnection(connection);
      await this.closeConnection(connection);
    }
    return this.version;
  }

  public async getRawPoolConnection(): Promise<RawPoolConnection> {
    this.throwIfDisconnected();
    const connection = await this.pool.acquire().promise;
    return {
      connection,
      release: async () => {
        await this.pool.release(connection);
      },
    };
  }

  public async getRawDriverConnection<T>(): Promise<T> {
    return (await this.createConnection(true)) as T;
  }

  protected assignPoolEvents(): void {
    this.pool.on(
      'acquireSuccess',
      (eventId: number, connection: PoolConnection) => {
        if (typeof this.poolEvents.acquired === 'function') {
          this.poolEvents.acquired(connection.__lupdo_uuid, eventId);
        }

        if (this.hasDebug) {
          console.log(`Pdo Pool Resource Acquired: ${connection.__lupdo_uuid}`);
        }
      },
    );

    this.pool.on('release', (connection: PoolConnection) => {
      if (typeof this.poolEvents.released === 'function') {
        this.poolEvents.released(connection.__lupdo_uuid);
      }

      if (this.hasDebug) {
        console.log(`Pdo Pool Resource Released: ${connection.__lupdo_uuid}`);
      }
    });
  }

  protected abstract createConnection(
    unsecure?: boolean,
  ): Promise<PoolConnection>;
  protected abstract getRawConnection(): PdoRawConnectionI;
  protected abstract closeConnection(connection: PoolConnection): Promise<void>;
  protected abstract destroyConnection(
    connection: PoolConnection,
  ): Promise<void>;
  protected abstract createPdoConnection(
    connection: PoolConnection,
  ): PdoConnectionI;
  protected abstract validateRawConnection(connection: PoolConnection): boolean;
  protected abstract getVersionFromConnection(
    connection: PoolConnection,
  ): Promise<string>;

  protected throwIfDisconnected(): void {
    if (this.disconnected) {
      throw new PdoError('Pdo is Disconnected from pool, please reconnect.');
    }
  }
}
export default PdoDriver;
