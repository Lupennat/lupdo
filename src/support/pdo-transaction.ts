'use strict';

import { PdoTransactionPreparedStatementI } from '../types/pdo-prepared-statement';
import { PdoRawConnectionI } from '../types/pdo-raw-connection';
import { PdoStatementI } from '../types/pdo-statement';
import {
  PdoTransactionI,
  TransactionInstances,
} from '../types/pdo-transaction';
import PdoStatement from './pdo-statement';
import PdoTransactionPreparedStatement from './pdo-transaction-prepared-statement';

export default class PdoTransaction implements PdoTransactionI {
  protected instances: TransactionInstances = {
    preparedStatement: PdoTransactionPreparedStatement,
    statement: PdoStatement,
  };

  constructor(protected readonly connection: PdoRawConnectionI) {}

  async commit(): Promise<void> {
    return await this.connection.commit();
  }

  async rollback(): Promise<void> {
    return await this.connection.rollback();
  }

  async exec(sql: string): Promise<number> {
    return await this.connection.exec(sql);
  }

  async prepare(sql: string): Promise<PdoTransactionPreparedStatementI> {
    return new this.instances.preparedStatement(
      this.connection,
      sql,
      await this.connection.prepare(sql),
    );
  }

  async query(sql: string): Promise<PdoStatementI> {
    return new this.instances.statement(
      this.connection,
      sql,
      ...(await this.connection.query(sql)),
    );
  }
}
