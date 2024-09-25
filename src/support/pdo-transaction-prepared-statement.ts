import PdoError from '../errors/pdo-error';
import {
  ArrayParams,
  ObjectParams,
  Params,
  PdoTransactionPreparedStatementI,
  ValidBindings,
} from '../types/pdo-prepared-statement';
import { PdoRawConnectionI } from '../types/pdo-raw-connection';
import { paramsToString } from '../utils';
import PdoStatement from './pdo-statement';

export default class PdoTransactionPreparedStatement
  extends PdoStatement
  implements PdoTransactionPreparedStatementI
{
  protected bindedParams: Params | null = null;
  protected bindedRawParams: Params | null = null;

  constructor(
    connection: PdoRawConnectionI,
    rawSql: string,
    protected readonly statement: any,
  ) {
    super(connection, rawSql, {}, [], []);
  }

  protected generateBinding(
    key: string | number,
    value: ValidBindings,
    params: Params | null,
    rawParams: Params | null,
  ): [Params | null, Params | null] {
    const bindedValue = this.connection.bindValue(value);

    if (typeof key === 'number') {
      if (key - 1 < 0) {
        throw new PdoError('Bind position must be greater than 0.');
      }
      const index = key - 1;
      if (params === null) {
        params = [];
        rawParams = [];
      }

      if (!Array.isArray(params)) {
        throw new PdoError('Mixed Params Numeric and Keyed are forbidden.');
      }

      (params as ArrayParams)[index] = bindedValue;
      (rawParams as ArrayParams)[index] = value;
    } else {
      if (params === null) {
        params = {};
        rawParams = {};
      }

      if (Array.isArray(params)) {
        throw new PdoError('Mixed Params Numeric and Keyed are forbidden.');
      }

      (params as ObjectParams)[key] = bindedValue;
      (rawParams as ObjectParams)[key] = value;
    }

    return [params, rawParams];
  }

  public bindValue(key: string | number, value: ValidBindings): void {
    [this.bindedParams, this.bindedRawParams] = this.generateBinding(
      key,
      value,
      this.bindedParams,
      this.bindedRawParams,
    );
  }

  public async execute(params?: Params): Promise<void> {
    this.params = null;
    this.rawParams = null;

    if (params != null) {
      if (Array.isArray(params)) {
        for (let x = 0; x < params.length; x++) {
          [this.params, this.rawParams] = this.generateBinding(
            x + 1,
            params[x],
            this.params,
            this.rawParams,
          );
        }
      } else {
        for (const key in params) {
          [this.params, this.rawParams] = this.generateBinding(
            key,
            params[key],
            this.params,
            this.rawParams,
          );
        }
      }
    } else {
      this.params = this.bindedParams;
      this.rawParams = this.bindedRawParams;
    }

    [this.sql, this.affectingResults, this.selectResults, this.columns] =
      await this.connection.execute(this.rawSql, this.params);
    this.resetCursor();
    this.resetRowset();
    this.setCurrentColumns();
    this.setCurrentSelectResults();
  }

  public debug(): string {
    return `SQL: ${this.rawSql}\nPARAMS:${paramsToString(this.rawParams ?? this.bindedRawParams ?? [], 2)}`;
  }

  public debugSent(): string {
    return `PROCESSED SQL: ${this.sql}\nPARAMS:${paramsToString(this.params ?? this.bindedParams ?? [], 2)}`;
  }
}
