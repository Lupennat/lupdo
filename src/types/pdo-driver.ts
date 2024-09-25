import { PdoAttributes } from './pdo-attributes';
import { PdoPoolOptions, RawPoolConnection } from './pdo-pool';
import {
  PdoPreparedStatementConstructor,
  PdoPreparedStatementI,
} from './pdo-prepared-statement';
import { PdoStatementConstructor, PdoStatementI } from './pdo-statement';
import { PdoTransactionConstructor, PdoTransactionI } from './pdo-transaction';

export interface DriverInstances {
  preparedStatement: PdoPreparedStatementConstructor;
  statement: PdoStatementConstructor;
  transaction: PdoTransactionConstructor;
}

export type PdoDriverConstructor = new (
  driver: string,
  options: any,
  poolOptions: PdoPoolOptions,
  attributes: PdoAttributes,
) => PdoDriverI;

export interface PdoDriverI {
  beginTransaction: () => Promise<PdoTransactionI>;

  disconnect: () => Promise<void>;

  reconnect: () => void;

  prepare: (sql: string) => Promise<PdoPreparedStatementI>;

  exec: (sql: string) => Promise<number>;

  query: (sql: string) => Promise<PdoStatementI>;

  on: (
    eventName: 'log',
    handler: (level: string, message: string) => void,
  ) => void;

  getAttribute: (attribute: string) => string | number;

  setAttribute: (attribute: string, value: number | string) => boolean;

  getRawPoolConnection: () => Promise<RawPoolConnection>;

  getRawDriverConnection: <T>() => Promise<T>;

  getVersion: () => Promise<string>;
}
