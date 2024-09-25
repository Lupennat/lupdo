import {
  PdoAffectingData,
  PdoColumnData,
  PdoRowData,
  ValidBindingsSingle,
} from '../../src';
import BaseTypedBinding from '../../src/bindings/base-typed-binding';
import LengthTypedBinding from '../../src/bindings/length-typed-binding';
import NumericTypedBinding from '../../src/bindings/numeric-typed-binding';
import PrecisionTypedBinding from '../../src/bindings/precision-typed-binding';
import PdoRawConnection from '../../src/support/pdo-raw-connection';
import FakeDBConnection, { FakeDBStatement } from './fake-db-connection';

export default class FakeRawConnection extends PdoRawConnection {
  public async lastInsertId(
    { affectingResults }: { affectingResults: PdoAffectingData },
    name?: string,
  ): Promise<string | number | bigint | null> {
    if (name != null) {
      return name;
    }
    return super.lastInsertId({ affectingResults });
  }

  protected async doBeginTransaction(
    connection: FakeDBConnection,
  ): Promise<void> {
    await connection.beginTransaction();
  }

  protected async doCommit(connection: FakeDBConnection): Promise<void> {
    await connection.commit();
  }

  protected async doRollback(connection: FakeDBConnection): Promise<void> {
    await connection.rollback();
  }

  protected async getStatement(
    sql: string,
    connection: FakeDBConnection,
  ): Promise<FakeDBStatement> {
    return await connection.prepare(sql);
  }

  protected async executeStatement(
    statement: FakeDBStatement,
    bindings: string[] | { [key: string]: string },
  ): Promise<
    [
      string,
      PdoAffectingData,
      PdoRowData[][] | PdoRowData[],
      PdoColumnData[][] | PdoColumnData[],
    ]
  > {
    return [statement.query, ...(await statement.execute(bindings))];
  }

  protected async closeStatement(
    statement: FakeDBStatement,
    connection: FakeDBConnection,
  ): Promise<void> {
    connection.unprepare(statement.query);
  }

  protected async doExec(
    connection: FakeDBConnection,
    sql: string,
  ): Promise<PdoAffectingData> {
    return (await connection.query(sql))[0];
  }

  protected async doQuery(
    connection: FakeDBConnection,
    sql: string,
  ): Promise<
    [
      PdoAffectingData,
      PdoRowData[][] | PdoRowData[],
      PdoColumnData[][] | PdoColumnData[],
    ]
  > {
    return await connection.query(sql);
  }

  protected adaptBindValue(value: ValidBindingsSingle): string {
    if (value === null) {
      return 'null';
    }
    if (value instanceof BaseTypedBinding) {
      let val = value.value;
      if (value.options != null) {
        val = val == null ? '' : val.toString();
        switch (true) {
          case value instanceof PrecisionTypedBinding:
            if ('precision' in value.options) {
              val = parseFloat(val).toFixed(value.options.precision);
            }
            return this.adaptBindValue(val);
          case value instanceof NumericTypedBinding:
            const maxDigits = value.options.total ?? 0;
            const maxDecimals = value.options.places ?? 0;
            const maxInteger = maxDigits ? maxDigits - maxDecimals : Infinity;

            if (maxInteger !== Infinity) {
              const [integer] = val.split('.');
              const maxIntegerValue = BigInt(''.padStart(maxInteger, '9'));
              const currentIntegerValue = BigInt(integer ?? '0');
              if (currentIntegerValue > maxIntegerValue) {
                val =
                  maxIntegerValue.toString() +
                  (maxDecimals ? '.' + ''.padStart(maxDecimals, '9') : '');
              } else {
                val = parseFloat(val).toFixed(maxDecimals);
              }
            }

            return this.adaptBindValue(val);
          case value instanceof LengthTypedBinding:
            return this.adaptBindValue(val);
          default:
            return this.adaptBindValue(val);
        }
      }

      return this.adaptBindValue(val);
    }

    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
      return value.toString();
    }

    return value;
  }
}
