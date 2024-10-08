import { RawPoolConnection } from './pdo-pool';
import { PdoPreparedStatementI } from './pdo-prepared-statement';
import { PdoStatementI } from './pdo-statement';
import { PdoTransactionI } from './pdo-transaction';

export type PdoLogger = (level: any, message: any) => any;

export interface PdoI {
  beginTransaction: () => Promise<PdoTransactionI>;

  prepare: (sql: string) => Promise<PdoPreparedStatementI>;

  exec: (sql: string) => Promise<number>;

  query: (sql: string) => Promise<PdoStatementI>;

  getAttribute: (attribute: string) => string | number;

  setAttribute: (attribute: string, value: number | string) => boolean;

  getRawPoolConnection: () => Promise<RawPoolConnection>;

  getRawDriverConnection: <T>() => Promise<T>;

  disconnect: () => Promise<void>;

  reconnect: () => void;

  getVersion: () => Promise<string>;
}
